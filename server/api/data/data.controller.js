'use strict';

var _ = require('lodash');
var Data = require('./data.model');
var request = require('request');
var parseString = require('xml2js').parseString; 
var cheerio = require('cheerio');
var async = require('async');
 


// getData from Zillow
exports.zillow = function(req, res){
  var url = 'http://www.zillow.com/webservice/GetDeepSearchResults.htm';
  var homeData = {};
  var citystate = encodeURI(req.body.city + ", " + req.body.state + " " + req.body.zip);

  var options = {
    url: url,
    method: 'GET',
    qs: {
      "zws-id": "X1-ZWz1dwodyamo0b_4ok8b",
      "address": req.body.street,
      "citystatezip": citystate,
      "rentzestimate": true
      }
  };

   request(options, function(err, response, body){
     parseString(body, function (err, result){
       homeData.zpid = result["SearchResults:searchresults"].response[0].results[0].result[0].zpid[0];
       homeData.lastSoldDate = result["SearchResults:searchresults"].response[0].results[0].result[0].lastSoldDate[0];
       homeData.lastSoldPrice = result["SearchResults:searchresults"].response[0].results[0].result[0].lastSoldPrice[0]["_"];
       homeData.yearBuilt = result["SearchResults:searchresults"].response[0].results[0].result[0].yearBuilt[0];
       homeData.zestimate = result["SearchResults:searchresults"].response[0].results[0].result[0].zestimate[0].amount[0]["_"];
       homeData.rentzestimate = result["SearchResults:searchresults"].response[0].results[0].result[0].rentzestimate[0].amount[0]["_"];
       homeData.taxAssessment = result["SearchResults:searchresults"].response[0].results[0].result[0].taxAssessment[0];
       homeData.taxAssessmentYear = result["SearchResults:searchresults"].response[0].results[0].result[0].taxAssessmentYear[0];
       homeData.taxAssessmentYear = result["SearchResults:searchresults"].response[0].results[0].result[0].address[0].latitude;
       homeData.taxAssessmentYear = result["SearchResults:searchresults"].response[0].results[0].result[0].address[0].longitude;
      });     
      
      return res.send(homeData);
   });  
};



// sentiment analysis from alchemy
exports.sentiment = function(req, res){
      var url = 'http://access.alchemyapi.com/calls/text/TextGetRankedKeywords';

      //console.log(req.body.text);
      //var text = encodeURI(req.body.text);
      // console.log("TEXT: " + text);
      var text = req.body.text;

      var options = {
        url: url,
        method: 'POST',
        form: {
          "apikey": "f4f684217caf2db982e4f0e5ba61402cf452890a",
          "text": text,
          "keywordExtractMode": "strict",
          "sentiment": 1,
          "outputMode": "json",
          "maxRetrieve": 50
          }
      };

      request(options, function(err, response, body){

        var sentimentBody  = JSON.parse(body);
        var keywordsArr = [];

        for (var i = 0; i < sentimentBody.keywords.length; i++){
            var keywordObj = {};

            keywordObj.text = sentimentBody.keywords[i].text;
            keywordObj.group = sentimentBody.keywords[i].sentiment.type;
            keywordObj.sentimentScore = sentimentBody.keywords[i].sentiment.score;
            keywordsArr.push(keywordObj);
        }

        return res.send(keywordsArr);
      });
};



// sentiment analysis from alchemy
exports.hpsentiment = function(req, res){
      var url = 'https://api.idolondemand.com/1/api/sync/analyzesentiment/v1';

      //console.log(req.body.text);
      //var text = encodeURI(req.body.text);
      // console.log("TEXT: " + text);
      var text = req.body.text;

      var options = {
        url: url,
        method: 'POST',
        form: {
          "apikey": "f32afc00-68d5-4b7d-850f-b26e4b9c6836",
          "text": text,
          "language": "eng"
          }
      };

      request(options, function(err, response, body){

        // var sentimentBody  = JSON.parse(body);
        // var keywordsArr = [];

        // for (var i = 0; i < sentimentBody.keywords.length; i++){
        //     var keywordObj = {};

        //     keywordObj.text = sentimentBody.keywords[i].text;
        //     keywordObj.group = sentimentBody.keywords[i].sentiment.type;
        //     keywordObj.sentimentScore = sentimentBody.keywords[i].sentiment.score;
        //     keywordsArr.push(keywordObj);
        // }

        return res.send(body);
      });
};



exports.yelp = function(req, res){

    var counter = 0;
    //var originalURL = 'http://www.yelp.com/biz/pax-wholesome-foods-new-york-15';
    //var originalURL = 'http://www.yelp.com/biz/upstate-new-york-2';
    //var originalURL = 'http://www.yelp.com/biz/botto-italian-bistro-richmond-3';
    var originalURL = req.body.url;
    console.log(originalURL);
    var url;
    var numReviews = 0;
    var json = {reviews: []};
    var total;

    var callOnYelp = function(i, json, numReviews){
        total = i * 40;
        url = originalURL+'?start=' + total;
        //console.log("URL" + url);
        
        if (numReviews > total){
            request(url, function(error, response, html){

              // First we'll check to make sure no errors occurred when making the request
                if(!error){
                    //console.log("if statement" + url + "i: " + i);
                    // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
                    var $ = cheerio.load(html);

                    // Finally, we'll define the variables we're going to capture
                    $('.ieSucks').filter(function(){

                        // Let's store the data we filter into a variable so we can easily see what's going on.
                        var data = $(this);

                        // console.log("parent: " + data.parent().attr('class'));
                        if (data.parent().attr('class') != 'footer-subsection'){

                            // In examining the DOM we notice that the title rests within the first child element of the header tag. 
                            // Utilizing jQuery we can easily navigate and get the text by writing the following code:
                            var review = data.text();
                           // console.log("if statement: " + url + "i: " + i);
                           if (json.reviews.indexOf(review) === -1)

                            // Once we have our title, we'll store it to the our json object.
                                json.reviews.push(review); 
                            //console.log("review" + review);
                        }
                    });
                }

                if (i < 1)
                    callOnYelp(++i, json, numReviews);
                else
                    return res.send(json);
            });
        }

        else 
            return res.send(json);
    };
  


    request(originalURL, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);
            var numReviewsArr = $('.rating-qualifier').first().text().split(' ');

            numReviewsArr.forEach(function(val){
              if ((/[0-9]+/).test(val)) { numReviews = parseInt(val); }
            }); 
        }

        console.log("IN REQ: " + numReviews);

        callOnYelp(0, json, numReviews)
    });
}




exports.getYelp = function(req, res){
    var yelp = require("yelp").createClient({
        consumer_key: "tWXZ06XhpgOgzdFCXjwuXQ", 
        consumer_secret: "WQUWDghej2WlzvZD-_PgOUAjSLI",
        token: "TB0HMwCq94InphtgQKfabp2MVspS_ysX",
        token_secret: "tv3BlSjz88DejQ2l9obovuy4MIM"
      });

      var search = req.body.search;
      var location = req.body.location;
      var restObj = {};
      var rest = [];
      var bizArr = [];

      // See http://www.yelp.com/developers/documentation/v2/search_api
      yelp.search({term: search, location: location}, function(error, data) {

        bizArr = data.businesses;
        console.log(bizArr);

        for (var i=0; i<bizArr.length; i++){
          restObj = {};
          restObj.name = bizArr[i].name;
          restObj.url = bizArr[i].url;
          rest.push(restObj);
        }

          console.log("REST: ", rest);
          console.log(error);
        
          var retObj = {restaurants: rest}
          return res.json(retObj);
        });

}












// Get list of datas
exports.index = function(req, res) {
  Data.find(function (err, datas) {
    if(err) { return handleError(res, err); }
    return res.json(200, datas);
  });
};

// Get a single data
exports.show = function(req, res) {
  Data.findById(req.params.id, function (err, data) {
    if(err) { return handleError(res, err); }
    if(!data) { return res.send(404); }
    return res.json(data);
  });
};

// Creates a new data in the DB.
exports.create = function(req, res) {
  Data.create(req.body, function(err, data) {
    if(err) { return handleError(res, err); }
    return res.json(201, data);
  });
};

// Updates an existing data in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Data.findById(req.params.id, function (err, data) {
    if (err) { return handleError(res, err); }
    if(!data) { return res.send(404); }
    var updated = _.merge(data, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, data);
    });
  });
};

// Deletes a data from the DB.
exports.destroy = function(req, res) {
  Data.findById(req.params.id, function (err, data) {
    if(err) { return handleError(res, err); }
    if(!data) { return res.send(404); }
    data.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}