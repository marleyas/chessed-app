/*------------------------------------------------------------------------------
    Módulo com os controllers
------------------------------------------------------------------------------*/
var app = angular.module('starter.controllers', ['ionic', 'ngCordova','ionic-audio'])
app.constant('$ionicLoadingConfig', {
  template: '<img src="img/rabbi-spinner.png" /><br>Carregando dados...'
}) 
// usa um numero como limitação do n-repeat como um range. 
// útil nos loops de conteudo da biblia
app.filter('range', function() {
    return function(val, range) {
      range = parseInt(range);
      for (var i=0; i<range; i++)
        val.push(i);
      return val;
    }
  })
 /*------------------------------------------------------------------------------
    ParashatCtrl: Exibe a Parashat, Haftara e o Divrê
    1 - verifica se o usuário está registrado, e redireciona para a tela de registro
    2 - conecta ao server e busca o conteudo
    3 - busca o divre e seus comentários
    4 - carrega a imagem
    5 - carrega a parashat e haftara do SQlite    
  ------------------------------------------------------------------------------*/
  .controller('ParashatCtrl', function ($location,
                                        $scope, 
                                        $rootScope,                                       
                                        $ionicModal,
                                        $ionicPlatform,
                                        $ionicLoading, 
                                        $cordovaDialogs,
                                        $cordovaPush,                                                                           
                                        WebService,                                         
                                        ImageService,
                                        ParashatService,
                                        BibleService,                                        
                                        StorageService,
                                        DBA) {                                                                            

    // verifica se o usuário já está registrado                                          
    $rootScope.user = StorageService.getUser();     
    if ($rootScope.user.length == 0)    
    { 
      $location.path('register');      
    } else {
      // retorna o id em clientes que guardaram o json encodado
      if ($rootScope.user.length > 2)
      {
        var _user = JSON.Parse($rootScope.user);
        console.log('lendo o valor de StorageService');
        console.log(_user);
        $rootScope.user = _user.id;        
        StorageService.setUser(_user);               
      }
    }   

    $ionicPlatform.ready(function() {
           
      // inicializa o push
      var push = PushNotification.init({
            android: {
                senderID: "671459406134",
                vibrate: true,                
				        icon: 'ic_rabbi',
                color: '#387ef5'
            }
        });

      // registra o dispositivo para o push
      push.on('registration', function(data) {
        console.log('registrationId: '+data.registrationId);
        $rootScope.registrationId = data.registrationId;
        // forzzsiUU2k:APA91bHeei3LatJi845nk7Wy0bPKYcHqX0dfgWUB3HCfHo_uz0Xd9-WYYLe-FT77y6k5JpJuq2WlhiLwzASvRaXqHmXWRSo2EBWiw_AN3fKsJbAdpdxakgqss7i_dIgmI2KkDC51OtzX
       
        // atualiza o deviceId no servidor
        WebService.updateDeviceInfo($rootScope.user, $rootScope.registrationId).then(function (data) {
          //console.log(data.data);
          // exibe a notificação
          push.on('notification', function(data) {         
            $cordovaDialogs.alert(data.message, 'Notificação'); 
            console.log('push message: '+data.message);        
          });
        });
      });      
    });
    
    // inicializa o escopo local    
    $scope.imageHome = 'img/backs/hebrew-text.jpg';
    $scope.parashat = null;
    $scope.haftara = null;
    // inicia a aba no blog
    $scope.activeItem = 'blog'; //'blog';
    // controle das abas
    $scope.setActiveItem = function (item) {
      $scope.activeItem = item;      
    }
    // conecta ao servidor no init
    $scope.init = function () {
      $ionicLoading.show();
      // conecta ao server e busca as opçoes de configuração      
      WebService.connectServer().then(function (data) {
        $scope.dataServer = data;        
        // monta o objeto json para o player de audio da parashat
        $scope.dataServer.trackParashat = {
          url: $scope.dataServer.parashat.p_audio,
          artist: 'Nelson',          
          title: 'Parashat ' + $scope.dataServer.parashat.p_name
         };
        // monta o objeto json para o player de audio da haftara
        $scope.dataServer.trackHaftara = {
          url: $scope.dataServer.parashat.h_audio,
          artist: 'Nelson',          
          title: 'Haftara de ' + $scope.dataServer.parashat.p_name
        };
        // monta o objeto json para o player de audio do divre
        $scope.dataServer.trackDivre = {
          url: $scope.dataServer.url_audio,
          artist: 'Nelson',
          title: 'Divre de ' + $scope.dataServer.parashat.p_name          
        };
        // formata os campos de data/hora
        //$scope.dataServer.local_date = moment().format('MMM D YYYY');
        $scope.dataServer.local_date = moment().format('dddd , D [de] MMMM [de] YYYY');
        $scope.dataServer.created_at = moment($scope.dataServer.created_at);
        // formata os campos de data/hora
        $scope.dataServer.comments.forEach(function(current_value, index, initial_array) {
            current_value.created_at = moment(current_value.created_at);
        });
        // busca os dados das parashiots no servidor
        WebService.readFile('tora/parashiots.json').then(function (data) {
          var _p = data;          
          for (var i = 0, len = _p.length; i < len; i++) {
            //console.log(_p[i].p_name);            
            ParashatService.setAudioParashatHaftara(_p[i].p_name, _p[i].p_audio, _p[i].h_audio, _p[i].id).then(function(obj) {});                   
          }
          $ionicLoading.hide();
        });        
        // carrega a imagem da Home
        $scope.imageHome = ImageService.getImage($scope.dataServer.image);
        $ionicLoading.show({
          template: 'Carregando Parashat da semana...'
        });
        
        // carrega os dados da parashat e haftara        
        ParashatService.getParashat($scope.dataServer.parashat.id).then(function(parashat){
          $scope.parashatHaftara = parashat;          
          // carrega o conteudo da parashat          
          ParashatService.getParashatContent($scope.parashatHaftara.p_book_id, $scope.parashatHaftara.p_verse_start, $scope.parashatHaftara.p_chapter_start, $scope.parashatHaftara.p_book_id, $scope.parashatHaftara.p_verse_end, $scope.parashatHaftara.p_chapter_end).then(function (data) {          
            $scope.parashat = data;
            // busca o nome do livro da parashat
            BibleService.getBibleBook($scope.parashatHaftara.p_book_id).then(function(book){              
              $scope.parashatHaftara.p_book_name_pt = book.name_pt;
              $ionicLoading.hide();
            })            
          });
          $ionicLoading.show({
            template: 'Carregando Haftara da semana...'
          });
          // carrega o conteudo da haftara          
          ParashatService.getParashatContent($scope.parashatHaftara.h_book_id, $scope.parashatHaftara.h_verse_start, $scope.parashatHaftara.h_chapter_start, $scope.parashatHaftara.h_book_id, $scope.parashatHaftara.h_verse_end, $scope.parashatHaftara.h_chapter_end).then(function (data) {               $scope.haftara = data; 
            // busca o nome do livro da haftara
            BibleService.getBibleBook($scope.parashatHaftara.h_book_id).then(function(book){                          
              $scope.parashatHaftara.h_book_name_pt = book.name_pt;
              $ionicLoading.hide();
            })          
          });

          // carrega as postagens do microblog          
          WebService.readFile('posts.json').then(function (data) {
            $scope.posts = data;                      
            // formata o campo de data/hora
            $scope.posts.forEach(function(current_value, index, initial_array) {
                current_value.created_at = moment(current_value.created_at);
                $scope.posts[index].track = {
                  url: current_value.audio,
                  title: current_value.user.name
                }
            });
          });
        });
      }); 
    }
    $ionicPlatform.ready(function() { 
      $scope.init(); 
      // Create and load the Modal
      $ionicModal.fromTemplateUrl('comment.html', function(modal) {
        $scope.modalComment = modal;
      }, {
        scope: $scope,
        animation: 'slide-in-up'
      });
      // Fecha o modal
      $scope.closeComment = function () {
        $scope.modalComment.hide();
      };
      // abre o modal de mensagem
      $scope.openComment = function () {
        $scope.modalComment.show();            
      };    
      // envia o comentário e fecha o modal
      $scope.doComment = function (userComment) {
        var userId =  StorageService.getUser();
        var divrinId = $scope.dataServer.id;          
        WebService.sendComment(userComment, userId, divrinId).then(function(data){
          comment = data.data;        
          if(comment) 
          { 
            comment.created_at = moment(comment.created_at);        
            $scope.dataServer.comments.push(comment);
            setTimeout(function(){ $scope.closeComment(); }, 1000);                      
          }   
        })
      }
      // carrega o modal de fotos
      $ionicModal.fromTemplateUrl('gallery.html', function(modal) {
        $scope.modalImage = modal;
      }, {
        scope: $scope,
        animation: 'slide-in-up'
      });

      // Fecha o modal
      $scope.closeImage = function () {
        $scope.modalImage.hide();
      };
      // abre o modal de mensagem
      $scope.openImage = function (image) {
        $scope.imageSrc = image;
        $scope.modalImage.show();            
      }; 




    });
  })
//------------------------- End ParashatCtrl -----------------------------------

/*------------------------------------------------------------------------------
    RegisterCtrl: Exibe o formulário de registro
    1 - verifica se o usuário preencheu os campos obrigatórios
    2 - conecta ao server e envia os dados   
    3 - seta a variavel de usuario e volta pra home    
  -----------------------------------------------------------------------------*/
  .controller('RegisterCtrl', function ($scope,
                                        $rootScope,
                                        $location,
                                        $ionicPlatform,
                                        $ionicHistory,
                                        WebService,                                         
                                        $cordovaDialogs, 
                                        StorageService){
                                          
    $scope.register = {
      name: '',
      email: '',
      celphone: '',
      code: ''
    }; 

    // remove a tela anterior do histórico
    $ionicHistory.clearHistory();

    //$ionicPlatform.ready(function() { 
      // verifica se o usuário já está registrado                                          
      $rootScope.user = StorageService.getUser();   
      if ($rootScope.user.length != 0)
      {            
        $location.path('/tab/parashat');      
      } else {  

        // envia o form de registro
        $scope.doRegister = function() {     
          // falta enviar o codigo e pegar a liberação          
          WebService.sendRegister($scope.register).then(function(data){ 
            scope: $scope;
            var retorno = data.data;
            if (retorno.status == 'error') {
              $cordovaDialogs.alert(retorno.msg, 'Erro');
            // se a resposta é ok salva o id do usuário no DB                
            } else {              
              StorageService.setUser(retorno.user);                        
              $cordovaDialogs.alert(retorno.msg, 'Sucesso');
              $location.path('/tab/parashat'); 
            }           
          })
        } 
      }    
  })
  //------------------------- End RegisterCtrl ---------------------------------

  /*----------------------------------------------------------------------------    
    Exibe a listagem das Parashiots 
  ----------------------------------------------------------------------------*/
  .controller('ParashiotsCtrl', function ($scope,
                                          $ionicPlatform,
                                          $ionicLoading,                                          
                                          ParashatService,
                                          WebService) {
    
    $scope.parashiots = [];

    $ionicLoading.show({
      template: 'Caregando lista de Parashiots...'
    });

    // carrega a lista de parashiots
    ParashatService.getParashiots().then(function (data) {               
      $scope.parashiots = data;
      $ionicLoading.hide();
    });
  })
  //------------------------- End ParashiotsCtrl -------------------------------

  /*----------------------------------------------------------------------------    
    Exibe a Parashat selecionada para leitura e audição 
  ----------------------------------------------------------------------------*/
  .controller('ParashiotsDetailCtrl', function ($scope,
                                                $ionicPlatform,
                                                $ionicLoading,                                               
                                                $stateParams,
                                                ParashatService,
                                                BibleService) {
    
    $scope.togglePlayback = false;

    $ionicLoading.show({
      template: 'Caregando Parashat...'
    });      

    $scope.activeItem = 'parashat'; 
    // controle das abas
    $scope.setActiveItem = function (item) {
      $scope.activeItem = item;      
    }

    // aguarda o carregamento da página para inicializar o conteudo
    $ionicPlatform.ready(function () {

      // inicia o player quando o audio muda
      $scope.playTrack = function() { 
        $scope.togglePlayback = !$scope.togglePlayback;  
      };

      // carrega os dados da parashat e haftara        
      ParashatService.getParashat($stateParams.parashatId).then(function(parashat){
        $scope.parashat = parashat;             
        $scope.trackParashat = {
          url: parashat.p_audio,
          artist: 'Nelson',
          title: 'Parashat ' + parashat.p_name
        };

        $scope.trackHaftara = {
          url: parashat.h_audio,
          artist: 'Nelson',
          title: 'Haftara de ' + parashat.p_name
        };

        // carrega o conteudo da parashat
        ParashatService.getParashatContent($scope.parashat.p_book_id, $scope.parashat.p_verse_start, $scope.parashat.p_chapter_start, $scope.parashat.p_book_id, $scope.parashat.p_verse_end, $scope.parashat.p_chapter_end).then(function (data) {          
          $scope.parashatContent = data;          
          // busca o nome do livro da parashat
          BibleService.getBibleBook($scope.parashat.p_book_id).then(function(book){              
            $scope.parashat.p_book_name_pt = book.name_pt;                                  
          })
        });

        ParashatService.getParashatContent($scope.parashat.h_book_id, $scope.parashat.h_verse_start, $scope.parashat.h_chapter_start, $scope.parashat.h_book_id, $scope.parashat.h_verse_end, $scope.parashat.h_chapter_end).then(function (data) {          
          $scope.haftaraContent = data;          
          // busca o nome do livro da parashat
          BibleService.getBibleBook($scope.parashat.h_book_id).then(function(book){              
            $scope.parashat.h_book_name_pt = book.name_pt;
            $ionicLoading.hide();                      
          })
        });        
      });                                       
    });
  })
  //------------------------- End ParashiotsDetailCtrl -------------------------

  /*----------------------------------------------------------------------------    
    Exibe a listagem dos Divrim com o player de audio
  ----------------------------------------------------------------------------*/
  .controller('DivreCtrl', function ($scope,
                                     $ionicPlatform,
                                     $ionicLoading,
                                     WebService) {

    $scope.shownGroup = 5777;                                       
    $scope.dinamicDivre = false;
    $scope.togglePlayback = false;

    $ionicLoading.show({
      template: 'Caregando lista de Divrim...'
    });

     // alterna a exibição do grupo de divrim por ano
    $scope.toggleGroup = function (group) {
      if ($scope.isGroupShown(group)) {
        $scope.shownGroup = null;
      } else {
        $scope.shownGroup = group;
      }
    };    
    // testa se o grupo está visivel
    $scope.isGroupShown = function (group) {
      return $scope.shownGroup === group;
    };

    // aguarda o carregamento da página para inicializar o conteudo
    $ionicPlatform.ready(function () {
      // carrega o conteudo dos divrin
      WebService.readFile('tora/divrin.json').then(function (data) {
        $scope.divrin = data;        
        // formata os campos data/hora e define os campos do player
        $scope.divrin.forEach(function(current_value, index, initial_array) {
            current_value.created_at = moment(current_value.created_at);
            current_value.url = current_value.url_audio;
            current_value.title = 'Divre de ' + current_value.parashat.p_name + ' / ' + current_value.jewish_year;
            current_value.artist = moment(current_value.created_at).format('DD/MM/YY');
        });         
        $ionicLoading.hide();
      });
      // muda o valor da variavel do audio atual
      $scope.setActualDivre = function(divre) {        
        for(var x = 0; x < $scope.divrin.length; x++)
        {          
          if($scope.divrin[x].id == divre)
          {           
            $scope.dinamicDivre = $scope.divrin[x];
            break;
          }
        }        
      }
      // inicia o player quando o audio muda
      $scope.playTrack = function() { 
        $scope.togglePlayback = !$scope.togglePlayback;  
      };
    })
  })
  //------------------------- End DivrinCtrl -----------------------------------

  /*----------------------------------------------------------------------------
    BibliaSidurCtrl: não faz nada só chama a view
  -----------------------------------------------------------------------------*/ 
  .controller('BibliaSidurCtrl', function ($scope) {})
  //----------------------- End BibliaSidurCtrl ---------------------------------

  /*-----------------------------------------------------------------------------
    BibliaCtrl: Exibe os versiculos se o livro for selecionado
  -----------------------------------------------------------------------------*/  
  .controller('BibliaCtrl', function ($scope,
                                      $location,
                                      $ionicPlatform,
                                      $ionicLoading,
                                      $ionicScrollDelegate, 
                                      $stateParams,                       
                                      BibleService) {
    
    $scope.actualChapter = 1; 
    $scope.shownGroup = 1;
    $scope.bookContent = [];        
    // exibe o loading de espera
    if ($stateParams.bookId) {
      var msg = 'Abrindo livro...';
    } else {
      var msg = 'Carregando livros da biblia...';
    }
    $ionicLoading.show({
      template: msg
    });   
    // agurada o carregamento da página para inicializar o conteudo
    $ionicPlatform.ready(function () {
      // carrega os arrays de grupos e livros      
       $scope.getGroupBooks = function() {
         BibleService.getBibleGroups().then(function(groups){
           $scope.groupBooks = groups;           
         });
       }       
       $scope.getGroupBooks();
       // carrega os arrays de livros      
       $scope.getBooks = function() {
         BibleService.getBibleBooks().then(function(books){
           $scope.books = books;                      
         });
       }       
       $scope.getBooks(); 
      if ($stateParams.bookId) {
        // carrega o conteudo do livro 
        $scope.getFullBook = function() {
          // primeiro busca os dados do livro
          BibleService.getBibleBook($stateParams.bookId).then(function(book){
            $scope.book = book;                                             
          });          
          // depois busca o conteudo
          $scope.loadChapter = function(chapter) {
            BibleService.getBibleVerses($stateParams.bookId, chapter).then(function(verses){
              $scope.bookContent = verses; 
              $scope.jumpToChapter(chapter);
              $ionicLoading.hide();                                  
            });
          }          
        }       
        $scope.getFullBook();
        $scope.loadChapter(1);
      } else {
        $ionicLoading.hide();
      }
    });
    // alterna a exibição do grupo de livros
    $scope.toggleGroup = function (group) {
      if ($scope.isGroupShown(group)) {
        $scope.shownGroup = null;
      } else {
        $scope.shownGroup = group;
      }
    };    
    // testa se o grupo está visivel
    $scope.isGroupShown = function (group) {
      return $scope.shownGroup === group;
    };
    // faz a rolagem para os capitulos
    $scope.scrollTo = function(target) {
      $location.hash(target);
      var handle = $ionicScrollDelegate.$getByHandle('biblePageDelegate');
      handle.anchorScroll(true); 
    };
    // chamma a função de rolagem para os capitulos
    $scope.jumpToChapter = function(value) {           
      $scope.scrollTo(value);
      $scope.actualChapter = value;
    }
  })
  //------------------------ End BibliaCtrl ------------------------------------

  /*----------------------------------------------------------------------------
    TorahCtrl: não faz nada só chama a view
  -----------------------------------------------------------------------------*/ 
  .controller('TorahCtrl', function ($scope) {
    $scope.isVisible = true;

    $scope.ocultaCard = function(){      
        $scope.isVisible = false;      
    }

    
  })
  //----------------------- End TorahCtrl ---------------------------------------

  /*----------------------------------------------------------------------------    
    Exibe a listagem de orações do Sidur
  ----------------------------------------------------------------------------*/
  .controller('SidurCtrl', function ($scope,
                                     $ionicLoading, 
                                     WebService) {
    
    $scope.sidurim = [];
    // exibe o loading de espera
    $ionicLoading.show({
      template: 'Carregando Sidur...'
    });                                       
    // carrega o array de orações do sidur    
    WebService.readFile('sidur/groups.json').then(function(data){    
      $scope.sidurim =  data;
      $ionicLoading.hide();              
    });    
  })
  //------------------------- End SidurCtrl --------------------------------------

  /*------------------------------------------------------------------------------    
    Exibe os detalhes das orações do Sidurm
  ------------------------------------------------------------------------------*/
  .controller('SidurDetailCtrl', function ($scope, 
                                           $stateParams, 
                                           $ionicLoading,
                                           $cordovaDialogs, 
                                           WebService) {

    // inicializa as variaveis
    $scope.sidurim = [];
    $scope.shownGroup = 1;    
    $scope.languageSidur = 'pt';
    // exibe o loading de espera
    $ionicLoading.show({
      template: 'Carregando oração do Sidur...'
    });
    // carrega o conteudo do sidur no array json    
    WebService.readFile('sidur/sections-prayers/'+$stateParams.sidurId+'.json').then(function(data){    
      $scope.sidurim =  data;
      $ionicLoading.hide();              
    });
    // alterna a exibição das rezas
    $scope.toggleGroup = function (group) {
      if ($scope.isGroupShown(group)) {
        $scope.shownGroup = null;
      } else {
        $scope.shownGroup = group;
      }
    };
    // verifica se a reza esta exibida
    $scope.isGroupShown = function (group) {
      return $scope.shownGroup === group;
    };
    // troca o idioma da oração pt/he
    $scope.changeLanguage = function (obj) {           
      if (obj.language == 'pt') {
        obj.language = 'he';
      } else {
         obj.language = 'pt';
      }
      $cordovaDialogs.beep(1);
    }
  })
  //----------------------End SidurDetailCtrl --------------------------------------
