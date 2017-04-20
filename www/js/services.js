/*------------------------------------------------------------------------------
    starter.services: Fornece alguns serviços para uso nos controllers 

    DBA: factory para abstrair o acesso ao SQlite 
    BibleService: factory para acesso as tabelas da biblia no SQlite  
    ParashatService: factory para acesso as tabelas da parashat e haftara no SQlite
    WebService: Conecta ao webservice e busca os dados de configuração via json
    ImageService: Carrega a imagem da Home de forma aleatoria    
------------------------------------------------------------------------------*/
angular.module('starter.services', ['ionic', 'ngCordova', 'ngStorage'])
  /*------------------------------------------------------------------------------
    DBA: factory para abstrair o acesso ao SQlite
    query:   executa uma consulta no banco de dados
    getAll:  retorna todos os resultados
    getById: retorna 1 registro    
  ------------------------------------------------------------------------------*/
  .factory('DBA', function($cordovaSQLite, $q, $cordovaDialogs, $ionicPlatform) {    
    var self = this;
    // previne potenciais erros na query
    self.query = function (query, parameters) {
      parameters = parameters || [];
      var q = $q.defer();
      $ionicPlatform.ready(function () {
        $cordovaSQLite.execute(db, query, parameters)
          .then(function (result) {
            q.resolve(result);
          }, function (error) {
            $cordovaDialogs.alert(error, 'Ocorreu um erro');
            console.warn(error);
            q.reject(error);
          });
      });
      return q.promise;
    }
    // Proces a result set
    self.getAll = function(result) {
      var output = [];
      for (var i = 0; i < result.rows.length; i++) {
        output.push(result.rows.item(i));
      }
      return output;
    }
    // Proces a single result
    self.getById = function(result) {
      var output = null;
      output = angular.copy(result.rows.item(0));
      return output;
    }
    return self;
  })
  //----------------------- End DBA ----------------------------------------------

  /*------------------------------------------------------------------------------
    BibleService: factory para acesso as tabelas da biblia no SQlite
    getBibleGroups: obtem os grupos de livros da biblia
    getBibleBooks:  obtem a relação de livros da biblia 
    getBibleBook:   obtem os dados de 1 livro
    getBibleVerses: obtem os versiculos de um determinado livro    
  ------------------------------------------------------------------------------*/
  .factory ('BibleService', function ($cordovaSQLite, DBA) {  
    var self = this;
    // obtem os grupos de livros da biblia
    self.getBibleGroups = function() {      
        return DBA.query('SELECT * FROM bible_groups WHERE is_active = 1')
          .then(function(result){
            return DBA.getAll(result);
          })      
    }
    // obtem os dados de 1 livro da biblia
    self.getBibleBook = function(bookId) { 
      var parameters = [bookId];         
      return DBA.query('SELECT * FROM bible_books WHERE id = ?', parameters)
        .then(function(result){
          return DBA.getById(result);
        })    
    }
    // obtem a relação de livros da biblia
    self.getBibleBooks = function() {      
      return DBA.query('SELECT * FROM bible_books WHERE is_active = 1 ORDER BY position')
        .then(function(result){
          return DBA.getAll(result);
        })    
    }    
    // obtem os versiculos de um determinado livro
    self.getBibleVerses = function(bookId, chapterId) {
      var parameters = [bookId, chapterId]; 
      return DBA.query('SELECT * FROM bible_verses WHERE book_id = ? AND chapter = ?', parameters)
        .then(function(result){
          return DBA.getAll(result);
        })      
    }     
    return self;
  }) 
  //----------------------- End DatabaseService ------------------------------------

  /*------------------------------------------------------------------------------
    ParashatService: factory para acesso as tabelas da parashat e haftara no SQlite
    getParashiots: obtem a lista das parashiots
    getParashat:  obtem os dados da parashat
    getParashatContent:   obtem o conteudo da parashat/haftara    
  ------------------------------------------------------------------------------*/
  .factory ('ParashatService', function ($cordovaSQLite, DBA) {
    var self = this; 
    // obtem a lista das parashiots
    self.getParashiots = function() {           
        return DBA.query('SELECT * FROM torah_parashiots')
          .then(function(result){
            return DBA.getAll(result);
          })      
    }
    // obtem os dados da parashat
    self.getParashat = function(pId) {      
      var parameters = [pId];     
      return DBA.query('SELECT * FROM torah_parashiots WHERE id = ?', parameters)
        .then(function(result){
          return DBA.getById(result);
        })    
    }
    // obtem os dados da parashat ou da haftara
    /*
    SELECT * FROM bible_verses WHERE id  >= (
		SELECT id FROM bible_verses WHERE book_id = ? AND verse_number = ? AND chapter = ?) 
        AND id <= (
		SELECT id FROM bible_verses WHERE book_id = ? AND verse_number = ? AND chapter = ?)
    */
    self.getParashatContent = function(bookIdStart, verseStart, chapterstart, bookIdEnd, verseEnd, chapterEnd) { 
      var parameters = [bookIdStart, verseStart, chapterstart, bookIdEnd, verseEnd, chapterEnd];            
      return DBA.query('SELECT * FROM bible_verses WHERE id  >= (SELECT id FROM bible_verses WHERE book_id = ? AND verse_number = ? AND chapter = ?) AND id <= (SELECT id FROM bible_verses WHERE book_id = ? AND verse_number = ? AND chapter = ?)', parameters)
        .then(function(result){
          return DBA.getAll(result);
        })    
    }
    // obtem os dados da parashat
    self.setAudioParashatHaftara = function(aParashatName, aParashatUrl, aHaftaraUrl, pId) {      
      var parameters = [aParashatName, aParashatUrl, aHaftaraUrl, pId];     
      return DBA.query('UPDATE torah_parashiots SET p_name = ?, p_audio = ?, h_audio = ? WHERE id = ?', parameters)
        .then(function(result){
          return DBA.getById(result);
        })    
    }

    return self;
  })
  //----------------------- End ParashatService ------------------------------------
  
  /*------------------------------------------------------------------------------
    StorageService: factory para acesso ao localstorage
    getAll:   retorna todos os itens em things
    getUser:  obtem o id do usuário
    add:      adiciona novo item a things
    remove:   deleta um item de things
    setUser:  update do id do usuário    
  ------------------------------------------------------------------------------*/
  .factory ('StorageService', function ($localStorage) {
    var self = this;
    // define o objeto localstorage
    $localStorage = $localStorage.$default({
      things: [],
      user: []
    });
    // retorna todos os itens em things
    self.getAll = function () {
      return $localStorage.things;
    };
    // obtem o id do usuário
     self.getUser = function () {       
       if($localStorage.user.length == 0)
       {
        return [];
       } else {
        return JSON.parse($localStorage.user);
       }
      
      
    };
    //adiciona novo item a things
    self.add = function (thing) {
      $localStorage.things.push(thing);
    }
    // deleta um item de things
    self.remove = function (thing) {
      $localStorage.things.splice($localStorage.things.indexOf(thing), 1);
    }
    // update do id do usuário 
    self.setUser = function (user) {
      $localStorage.user = user.id;
      return user;
    }
    return self;
  }) 
  //----------------------- End StorageService -----------------------------------

  /*------------------------------------------------------------------------------
    WebService: Conecta ao webservice e busca os dados de configuração via json
    getUrlBase: retorna a url de acesso ao webservice
    connectServer: busca os valores no servidor
    readFile: retorna o conteudo de um arquivo remoto    
------------------------------------------------------------------------------*/
// https://polar-citadel-22357.herokuapp.com/
  .factory('WebService', function($http, 
                                  $q,
                                  $cordovaDialogs,
                                  $ionicLoading) {
    var self = this;                                    
    var url_base = 'http://marleyadriano.com.br/api/v1/';
    //var url_base = 'http://localhost/api/v1/'; 

    // retorna a url do webservice
    self.getUrlBase = function() {
      return url_base;
    };
    // busca os valores no servidor
    self.connectServer = function() {
      var time_hash = new Date().getTime();        
      return $http.get(url_base + 'server.json?t=' + time_hash)
        .then(
          function (res) {                      
            return res.data;
          },
          function (err) {
            $cordovaDialogs.alert('Não foi possível conectar ao servidor!', 'Verifique sua conexão');
            $ionicLoading.hide();
          }
        )
    };
    // atualiza o id do device
    self.updateDeviceInfo = function(userId, registrationId) {
      $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';        
      return $http.post(
        url_base + 'device/update.json',
        {
          user_id: userId,
          device_id: registrationId
        },{
          dataType: 'json',
          cache: false
        }
      ).success(function(data, status, headers, config){        
        return data;        
      }).error(function(data, status){        
        return false;
      });
    };

    // busca arquivos json
    self.readFile = function(filename) {      
      return $http.get(url_base + filename)
        .then(
          function (res) {                      
            return res.data;
          },  
          function (err) {                        
            $cordovaDialogs.alert('Não foi possível conectar ao servidor!', 'Verifique sua conexão');                       
          }
        )
    }; 
    // envia um comentario para o servidor
    self.sendComment = function(userComment, userId, divrinId) {
      $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
      //$http.defaults.headers.post['Access-Control-Allow-Headers'] = 'Access-Control-Allow-Origin = *';
      urlComment = url_base + 'tora/divrin/comment/send';
      return $http.post(
        urlComment,              
        {
          user_id: userId,
          divrin_id: divrinId,
          comment: userComment
        },
        {
          dataType: 'json',
          cache: false
        }
      ).success(function(data, status, headers, config){        
        return data;        
      }).error(function(data, status){        
        return false;
      });
    };
    // envia o formulario de registro para o servidor
    self.sendRegister = function(userForm) {
      $http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
      //$http.defaults.headers.post['Access-Control-Allow-Headers'] = 'Access-Control-Allow-Origin = *';
      urlComment = url_base + 'register/send';
      return $http.post(
        urlComment,              
        userForm,
        {
          dataType: 'json',
          cache: false
        }
      ).success(function(data, status, headers, config){        
        return data;        
      }).error(function(data, status){        
        return false;
      });
    };
    return self;
  })
 //----------------------- End WebService --------------------------------------
  
/*------------------------------------------------------------------------------
    ImageService: Carrega a imagem da Home de forma aleatoria
    getRandomImage: retorna uma das imagens do array de forma aleatoria
    getImage: verifica ser o servidor enviou link da imagem, ou chama aleatoria
------------------------------------------------------------------------------*/
  .factory('ImageService', function() {
    var self = this;
    self.imageHome = [
      '86989-OI4R8R-395.jpg'            ,
      '86990-OI4R84-391.jpg'            ,
      '87863-OI82OM-561-640x480.jpg'    ,
      '87864-OI6PXW-96-640x480.jpg'     ,
      'breitwandaufmacher-nxsl-448895.jpg',
      'challah.jpg'                     ,
      'hanukkah-festival-of-lights.jpg' ,      
      'hebrew-handwritten-torah.jpg'    ,
      'hebrew-text.jpg'                 ,      
      'IS3-9-37DS.jpg'                  ,
      'jerusalem-01.jpg'                ,      
      'Prayer-Shawl-Tallit-jewish.jpg'  ,
      'wall-01.jpg'                     ,
      'wall-02.jpg'                     ,
      'window-star-david.jpg'           ,
      'bg-estante.jpg'                  ,
      'w610_r1_s_r1.jpg'                ,
      'ZA_NewTemp_BIB5.jpg'
    ];
    // retorna uma das imagens do array de forma aleatoria
    self.getRandomImage = function() {
      var n = Math.floor(Math.random() * self.imageHome.length);      
      return 'img/backs/' + self.imageHome[n];      
    };    
    // verifica ser o servidor enviou link para outra imagem, ou busca do array
    self.getImage = function(src) {      
      if (src){
        return src;        
      } else {
        return self.getRandomImage();
      }
    };
    return self; 
  })
//---------------------- End ImageService --------------------------------------