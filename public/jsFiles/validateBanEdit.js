const text = document.querySelector("#bannerText");
const submitButton = document.querySelector("#submit");
const imageError = document.querySelector("#imageError");

const image = document.querySelector("#image");
image.addEventListener("change", function () {
  const file = this.files[0];
  const fileType = file.type;
  
  if(!fileType.startsWith("image/")){
    
    this.value = ''
    imageError.innerText = "invalid file type";
    imageError.style.display = 'block';

    setTimeout(function(){
      imageError.style.display = 'none'
    },2000)
  }
  else{
    imageError.style.display = 'none'
    changePreviewImage(this)
  }
});

function changePreviewImage(newFile) {
  const file = newFile.files[0];
  if (file) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (event) {
      document.querySelector("#imagePreview").src = event.target.result;
    };
    
  }
}

submitButton.addEventListener('click',function(event){  
  const titleError = document.querySelector("#titleError");
  const title = text.value;  
  console.log(title);
  if(title === ''){    
    titleError.style.display = 'block';
    titleError.innerText = 'field Required';
    event.preventDefault();
  }
  else{
    console.log("blahhh");
  }

})