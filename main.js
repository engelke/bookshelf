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
   }

   function displayBookList(){
      var books = [];
      var i, key;

      $("#results li").remove();

      for(i=0; i<localStorage.length; i++) {
         key = localStorage.key(i);
         if (key.substr(0,5)=="asin_") {
            books.push(JSON.parse(localStorage.getItem(key)));
         }
      }

      books.sort(byReleaseDate).forEach(function(book){
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

   function saveSettings(){
      localStorage.accessKeyId = $("#accesskeyid").attr("value");
      localStorage.secretAccessKey = $("#secretaccesskey").attr("value");

      $("#settings").hide();
      showApplication();
   }

   function lookupIsbn(){
      var isbn = $("#isbn").attr("value");
      aws.itemLookup(isbn,
                     saveResponse, 
                     function(message){
                        alert("Something went wrong: "+message);
                     }
                     );

      function saveResponse(response){
         localStorage.setItem("asin_"+response.asin, JSON.stringify(response));
         displayBookList();
      }
   }
});

