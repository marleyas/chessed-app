// Ionic Starter App
var db = null;
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', [
                            'ionic', 
                            'starter.controllers', 
                            'starter.services', 
                            'ngCordova'
                          ])

.run(function($ionicPlatform, $cordovaSQLite, $cordovaDialogs) {
  $ionicPlatform.ready(function() {

    // https://github.com/Microsoft/cordova-plugin-code-push#getting-started
    // verifica se tem atualizações
    //codePush.sync();
    
    codePush.sync(null, {       
      installMode: InstallMode.IMMEDIATE,
      updateDialog: {
        updateTitle: 'Atualização',
        optionalUpdateMessage: 'Uma atualização está disponível e necessita ser instalada.',
        optionalInstallButtonLabel: 'Instalar',
        optionalIgnoreButtonLabel: 'Agora não'
      } 
    });
    

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
      console.log(window.cordova.plugins);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    
    if(window.cordova) {
      // App syntax
      db = $cordovaSQLite.openDB({name: 'biblia2.db', location: 'default', createFromLocation: 1});
      // correção haftara de Tsav
      $cordovaSQLite.execute(db, 'UPDATE torah_parashiots SET h_verse_end = 3 WHERE id = 25');
    } else {
      // Ionic serve syntax
      db = window.openDatabase('biblia2.db', '2.0', 'Biblia', -1);
    }      
    
  });
})
.config(function($sceDelegateProvider) 
{
    $sceDelegateProvider.resourceUrlWhitelist(['self', new RegExp('^(http[s]?):\/\/(w{3}.)?youtube\.com/.+$')]);
})
.config(function($ionicConfigProvider) 
{
  $ionicConfigProvider.views.maxCache(0);  
})
.config(function($stateProvider, $urlRouterProvider) 
{  
  $stateProvider
  .state('register', {
    cache: false,
    url: '/register',    
    templateUrl: 'templates/register.html',
    controller: 'RegisterCtrl'
  })
  .state('tab', {
    url: '/tab',
    //abstract: true,
    templateUrl: 'templates/tabs.html'
  })  
  .state('tab.parashat', {
    url: '/parashat',
    views: {
      'tab-parashat': {
        cache: false,
        templateUrl: 'templates/tab-parashat.html',
        controller: 'ParashatCtrl'
      }
    }
  })  
 .state('tab.parashiots', {
     url: '/parashiots',
     views: {
       'tab-parashiots': {
         templateUrl: 'templates/tab-parashiots.html',
         controller: 'ParashiotsCtrl'
       }
     }
   })
   .state('tab.parashiots-detail', {
     url: '/parashiots/:parashatId',
     views: {
       'tab-parashiots': {
         cache: false,
         templateUrl: 'templates/tab-parashiots-detail.html',
         controller: 'ParashiotsDetailCtrl'
       }
     }
   })
   .state('tab.divre', {
     url: '/divre',
     views: {
       'tab-divre': {
         cache: false,
         templateUrl: 'templates/tab-divre.html',
         controller: 'DivreCtrl'
       }
     }
   })
   .state('tab.torah', {
     url: '/torah',
     views: {
       'tab-torah': {
         templateUrl: 'templates/tab-torah.html',
         controller: 'TorahCtrl'
       }
     }
   }) 
   .state('tab.sidur', {
     url: '/sidur',
     views: {
       'tab-sidur': {
         templateUrl: 'templates/tab-sidur.html',
         controller: 'SidurCtrl'
       }
     }
   })   
   .state('tab.sidur-detail', {
     url: '/sidur/:sidurId',
     views: {
       'tab-sidur': {
         cache: false,
         templateUrl: 'templates/sidur-detail.html',
         controller: 'SidurDetailCtrl'
       }
     }
   })
    .state('tab.biblia-sidur', {
     url: '/biblia-sidur',
     views: {
       'tab-sidur': {
         cache: false,
         templateUrl: 'templates/tab-biblia-sidur.html',
         controller: 'BibliaSidurCtrl'
       }
     }
   })
   .state('tab.biblia', {
     url: '/biblia',
     views: {
       'tab-sidur': {
         templateUrl: 'templates/tab-biblia.html',
         controller: 'BibliaCtrl'
       }
     }
   })
   .state('tab.biblia-detail', {     
     url: '/biblia-detail/:bookId',
     views: {
       'tab-sidur': {
         cache: false,
         templateUrl: 'templates/biblia-detail.html',
         controller: 'BibliaCtrl'
       }
     }
   }); 
 
  $urlRouterProvider.otherwise('/tab');
  
})
