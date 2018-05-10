angular.module('photoUpload', ['ngRoute', 'ngFileUpload', 'firebase'])

.config(['$routeProvider',function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl: 'main.html',
		controller: 'MainCtrl'
	}).when('/gallery',{
		templateUrl: 'gallery.html',
		controller: 'GalleryCtrl'
	}).when('/manage' ,{
        templateUrl: 'manage.html',
        controller: 'ManageCtrl'
	}).otherwise({
		redirectTo: '/'
	})
}])

.controller('MainCtrl', ['$scope', '$firebaseStorage','$firebaseArray', function($scope, $firebaseStorage, $firebaseArray){
     var uploadbar = document.getElementById("uploadbar");
     //saving tag so that we can use it later to filter through images
     $scope.tags = {};
     $scope.displayMsg = true;
     $scope.msg = "No File selected. Please select a file to upload."; 


     $scope.selectFile = function(file){
     $scope.fileList = file;
     $scope.displayMsg = false;
     };

     //remove file from filelist
     $scope.removeFile = function(file){
      var index = $scope.fileList.indexOf(file);
      $scope.fileList.splice(index, 1);
      if ($scope.fileList.length < 1) {
      	$scope.displayMsg = true;
      }
     };

 $scope.uploadFile = function(file){
      var file = file;
      var tags = $scope.tags.name;
      if (tags == undefined) {
      	tags = null;
      }
     //create a firebase storage reference
      var storageRef = firebase.storage().ref('Photos/' + file.name);
      var storage = firebaseStorage(storageRef);

      //upload file
      var uploadTask = storage.$put(file);

      //update progress bar
      uploadTask.$progress(function(snapshot){
      	var percentageUpload = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        $scope.percentage = percentageUpload.toFixed(0);
        uploadbar.style.width = $scope.percentage + '%';
});
     //Upload Completion
     uploadTask.$complete(function(snapshot){
     	//remove filelist when uploading is complete
     	$scope.removeFile(file);
     	$scope.msg = "Photo uploaded successfully. select another photo to upload.";
     	var imageUrl = snapshot.downloadURL;
     	var imageName = snapshot.metadata.name;

     	//storing images url and details into firebase database
     	var ref = firebase.database().ref("Images");
     	var urls = $firebaseArray(ref);
     	//add data to firebase
     	urls.$add({
     		imageUrl: imageUrl,
     		imageName: imageName,
     		tags: tags
     	}).then(function(ref){
            var id = ref.key;
            console.log("Image added to the database successfully with ref key -" + id);
            urls.$indexFor(id);
        });


        //error while uploading
        uploadTask.$error(function(error){
        	console.log(error);

        });
     });
};


}])

.controller('GalleryCtrl', ['$scope', '$firebaseArray', function($scope, $firebaseArray){
   //create firebase database ref to access data 
   var ref = firebase.database().ref('Images')
   var urls = $firebaseArray(ref);
   $scope.urls = urls;
}])

.controller('ManageCtrl', ['$scope', '$firebaseArray', '$firebaseStorage', function($scope, $firebaseArray, $firebaseStorage){
  //creating a firebase ref to access data
   var ref = firebase.database().ref('Images')
   var urls = $firebaseArray(ref);
   $scope.urls = urls;

   //delete function
   $scope.deleteFile = function(url){
    //get storage reference
    var storageRef = firebase.storage().ref('Photos/' + url.imageName);
    var storage = firebaseStorage(storageRef);
    //delete file
    storage.$delete().then(function(){
    	$scope.urls.$remove(url); //removes file from the database
        console.log("deleted photo successfully");    
    }).catch(function(error){
       console.log(error.message);
    });

   }; 

}])




























