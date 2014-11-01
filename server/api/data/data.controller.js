'use strict';

var _ = require('lodash');
var Data = require('./data.model');
var request = require('request');
var parseString = require('xml2js').parseString; 
var cheerio = require('cheerio');
var async = require('async');


// sentiment analysis from alchemy
exports.sentiment = function(req, res){
      var url = 'http://access.alchemyapi.com/calls/text/TextGetRankedKeywords';
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

            // replace all non-alphanumeric letters with ""
            var pattern = "[^a-zA-Z0-9\\s]"
            var re = new RegExp(pattern, "ig")
            sentimentBody.keywords[i].text = sentimentBody.keywords[i].text.replace(re, "");

            // pull text, sentiment type, and sentiment score from data
            keywordObj.text = sentimentBody.keywords[i].text;
            keywordObj.group = sentimentBody.keywords[i].sentiment.type;
            keywordObj.sentimentScore = sentimentBody.keywords[i].sentiment.score;
            keywordsArr.push(keywordObj);
        }

        return res.send(keywordsArr);
      });
};


exports.yelp = function(req, res){

    var counter = 0;
    var originalURL = req.body.url;
    console.log(originalURL);
    var url;
    var numReviews = 0;
    var json = {reviews: []};
    var total;

    var callOnYelp = function(i, json, numReviews){
        total = i * 40;
        url = originalURL+'?start=' + total;
        
        if (numReviews > total){
            request(url, function(error, response, html){

              // First we'll check to make sure no errors occurred when making the request
                if(!error){

                    // Next, we'll utilize the cheerio library on the returned html which will essentially give us jQuery functionality
                    var $ = cheerio.load(html);

                    // Finally, we'll define the variables we're going to capture
                    $('.ieSucks').filter(function(){

                        // Let's store the data we filter into a variable so we can easily see what's going on.
                        var data = $(this);

                        // console.log("parent: " + data.parent().attr('class'));
                        if (data.parent().attr('class') !== 'footer-subsection'){

                            // In examining the DOM we notice that the title rests within the first child element of the header tag. 
                            // Utilizing jQuery we can easily navigate and get the text by writing the following code:
                            var review = data.text();

                           if (json.reviews.indexOf(review) === -1)

                            // Once we have our title, we'll store it to the our json object.
                                json.reviews.push(review); 
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

        for (var i=0; i<bizArr.length; i++){
          restObj = {};
          restObj.name = bizArr[i].name;
          restObj.url = bizArr[i].url;
          restObj.addr = bizArr[i].location.address[0];
          rest.push(restObj);
        }
        
          var retObj = {restaurants: rest}
          return res.json(retObj);
      });

}


