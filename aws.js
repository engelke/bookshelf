// Copyright (c) 2012 by Charles Engelke.

var AWS = function(accessKeyId, secretAccessKey, associateTag){
   var self = this;

   self.itemLookup = function(itemId, onSuccess, onError){
      var params = [];
      params.push({name: "Service", value: "AWSECommerceService"});
      params.push({name: "AWSAccessKeyId", value: accessKeyId});
      params.push({name: "AssociateTag", value: associateTag});
      params.push({name: "Operation", value: "ItemLookup"});
      params.push({name: "Timestamp", value: formattedTimestamp()});
      params.push({name: "ItemId", value: itemId});
      params.push({name: "IdType", value: "ISBN"});
      params.push({name: "SearchIndex", value: "Books"});
      params.push({name: "ResponseGroup", value: "ItemAttributes,Offers"});

      var signature = computeSignature(params, secretAccessKey);
      params.push({name: "Signature", value: signature});

      var queryString = createQueryString(params);
      var url = "https://webservices.amazon.com/onca/xml?"+queryString;

      jQuery.ajax({
         type : "GET",
         url: url,
         data: null,
         success: extractAndReturnResult,
         error: returnErrorMessage
      });

      function extractAndReturnResult(data, status, xhr){
         var results = [];
         var result, i, item;

         var items = $(data).find("Items Item");
         if (items === null) {
            onError('Amazon returned a result in an unsupported format');
         } else {
            for(i=0; i<items.length; i++){
               item = items[i];
               result = {
                  asin:          getValueFrom(item, "ASIN"),
                  author:        getValueFrom(item, "ItemAttributes Author"),
                  title:         getValueFrom(item, "ItemAttributes Title"),
                  releaseDate:   getValueFrom(item, "ItemAttributes PublicationDate"),
                  listPrice:     getValueFrom(item, "ItemAttributes ListPrice FormattedPrice"),
                  availability:  getValueFrom(item, "Offers Offer OfferListing Availability"),
                  amazonPrice:   getValueFrom(item, "Offers Offer OfferListing Price FormattedPrice"),
                  url:           getValueFrom(item, "DetailPageURL")
               };
               results.push(result);
            }
         }
         onSuccess(results);
      }

      function returnErrorMessage(xhr, status, error){
         onError('Ajax request failed with status message '+status);
      }
   }

   function getValueFrom(item, selector){
      var elements = $(item).find(selector);
      if ((elements !== null) && (elements.length > 0)) {
         return elements[0].textContent;
      } else {
         return "N/A";
      }
   }

   function formattedTimestamp(){
      var now = new Date();

      var year = now.getUTCFullYear();

      var month = now.getUTCMonth()+1; // otherwise gives 0..11 instead of 1..12
      if (month < 10) { month = '0' + month; } // leading 0 if needed

      var day = now.getUTCDate();
      if (day < 10) { day = '0' + day; }

      var hour = now.getUTCHours();
      if (hour < 10) { hour = '0' + hour; }

      var minute = now.getUTCMinutes();
      if (minute < 10) { minute = '0' + minute; }

      var second = now.getUTCSeconds();
      if (second < 10) { second = '0' + second; }

      return year+'-'+month+'-'+day+'T'+hour+':'+minute+':'+second+'Z';
   }

   function createQueryString(params){
      var queryPart = [];
      var i;

      params.sort(byNameField);

      for(i=0; i<params.length; i++){
         queryPart.push(encodeURIComponent(params[i].name) +
                        '=' +
                        encodeURIComponent(params[i].value));
      }

      return queryPart.join("&");

      function byNameField(a, b){
         if (a.name < b.name) { return -1; }
         if (a.name > b.name) { return 1; }
         return 0;
      }
   }

   function computeSignature(params, secretAccessKey){

      var stringToSign = 'GET\nwebservices.amazon.com\n/onca/xml\n' +
                         createQueryString(params);

      var key = sjcl.codec.utf8String.toBits(secretAccessKey);
      var hmac = new sjcl.misc.hmac(key, sjcl.hash.sha256);
      var signature = hmac.encrypt(stringToSign);
      signature = sjcl.codec.base64.fromBits(signature);

      return signature;
   }
}
