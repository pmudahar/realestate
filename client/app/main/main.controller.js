'use strict';

angular.module('realestateApp')
  .controller('MainCtrl', function ($scope, $http, socket, ngDialog) {
    $scope.awesomeThings = [];
    $scope.test = 'Paul';

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
    });

    $scope.addThing = function() {
      if($scope.newThing === '') {
        return;
      }
      $http.post('/api/things', { name: $scope.newThing });
      $scope.newThing = '';
    };

    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });

    $scope.getData = function(){
      $http.get('/api/datas')
    }

      $scope.getAddrInfo = function(url){
        $scope.text = "";
        $scope.keywords = [];
        $http.post('/api/datas/yelp', {url: url}).success(function(data){
          $scope.text = data.reviews.join(' ');

          // get keyword entities from 80 reviews of that restaurant
          $http.post('/api/datas/sentiment', {text: $scope.text}).success(function(sentiment){
            $scope.keywords = sentiment;
            
            // go through keywords and set weights to each keyword based on occurances
            for (var i = 0; i < $scope.keywords.length; i++){
              $scope.keywords[i].id = i;
              
              // count how many times the word appears in the reviews
              var str = $scope.keywords[i].text;
              var re = new RegExp(str, "ig")
              var count = ($scope.text).match(re);

              if (count)
                $scope.keywords[i].occurances = count.length;
              else
                $scope.keywords[i].occurances = 0;

              $scope.keywords[i].total_amount = Math.abs($scope.keywords[i].occurances * $scope.keywords[i].sentimentScore);

            }

              // open results in ngDialog
              ngDialog.open({ 
                templateUrl: '/components/createVisual/createVisual.html',
                controller: 'CreateVisualCtrl',
                scope: $scope
              }); 
            
          });
        });

      }


      $scope.getYelp = function(){
          $http.post('/api/datas/getYelp', {search: $scope.restaurant, location: $scope.location}).success(function(busArr){
            $scope.rest = busArr.restaurants;
            console.log(busArr.restaurants);
          });
      }



      $scope.getHPInfo = function(addrData){
            $http.post('/api/datas/hpsentiment', {text: $scope.text}).success(function(sentiment){
            
            console.log(sentiment);

            });
      }


}); 
