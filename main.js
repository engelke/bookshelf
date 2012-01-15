// Copyright (c) by Charles Engelke.

$(document).ready(function(){
   var aws;

   $("#lookup").click(lookupIsbn);
   $("#savesettings").click(saveSettings);

   if (localStorage.accessKeyId && localStorage.secretAccessKey) {
      showApplication();
   } else {
      showSettings();
   }

   function showSettings(){
      $("#settings").show();
   }

   function showApplication(){
      aws = new AWS(localStorage.accessKeyId, localStorage.secretAccessKey, "engelkecom-20");
      $("#application").show();
      displayBookList();
      updateBookList();
   }

   function getBookList(){
      var books = [];

      for(i=0; i<localStorage.length; i++) {
         key = localStorage.key(i);
         if (key.substr(0,5)=="asin_") {
            book = JSON.parse(localStorage.getItem(key));
            book.updatedAt = book.updatedAt || '0000-00-00T00:00:00Z';
            books.push(book);
         }
      }

      return books;
   }

   function displayBookList(){
      var books = getBookList().sort(byReleaseDate);

      $("#results li").remove();
      books.forEach(function(book){
         insertBook(book);
      });

      function byReleaseDate(a, b){
         if (a.releaseDate < b.releaseDate) {
            return -1;
         };
         if (a.releaseDate > b.releaseDate) {
            return 1;
         };
         return 0;
      }

      function insertBook(book){
         var html = '<li><a href="' + book.url + '" target="_blank">';
         html = html + book.title + '</a> by ' + book.author;
         html = html + ' lists for ' + book.listPrice;
         html = html + ' but sells for ' + book.amazonPrice;
         html = html + '. Released on ' + book.releaseDate;
         html = html + '. ' + book.availability;
         html = html + '.</li>';
         $("#results").append(html);
      }
   }

   function updateBookList(){
      var books = getBookList().sort(byUpdatedAt);
      var asins = [];

      for(var i=0; i<9; i++) {
         if (books.length > 0) {
            book = books.shift();
            asins.push(book.asin);
         }
      }

      lookupItems(asins);

      function byUpdatedAt(a, b){
         if (a.updatedAt < b.updatedAt) {
            return -1;
         };
         if (a.updatedAt > b.updatedAt) {
            return 1;
         };
         return 0;
      }
   }

   function saveSettings(){
      localStorage.accessKeyId = trimSpaces($("#accesskeyid").attr("value"));
      localStorage.secretAccessKey = trimSpaces($("#secretaccesskey").attr("value"));

      $("#settings").hide();
      showApplication();
   }

   function trimSpaces(s){
      return s.replace(/^\s*/, '').replace(/\s*$/, '');
   }

   function lookupIsbn(){
      var isbn = $("#isbn").attr("value").replace(/[^a-zA-Z0-9]/, '');

      lookupItems([isbn]);
   }

   function lookupItems(isbns){
      var isbn = isbns.join(',');

      aws.itemLookup(isbn,
                     saveResponse, 
                     function(message){
                        alert("Something went wrong: "+message);
                     }
                     );

      function saveResponse(responses){
         responses.forEach(function(response){
            localStorage.setItem("asin_"+response.asin, JSON.stringify(response));
         });
         displayBookList(getBookList());
      }
   }
});

