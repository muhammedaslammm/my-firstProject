// input key up
const inputFields = document.querySelectorAll('.input');
inputFields.forEach(function(field){
    const parentnode = field.parentNode;
    const error = parentnode.querySelector('p.error');
    field.addEventListener('keyup',function(){
        if(field.value.length !=0){
            error.innerText = ''
        }
        else{
            error.innerText = '*Field Required'
        }
    })
})
// category selection
const category = document.getElementById('category');
category.addEventListener('change',function(event){
    event.target.parentElement.parentElement.querySelector('.error').innerText = ''
})

// cropping and previewing image
// step1
function buttonClicked(event){
    event.preventDefault()
    const parentElement = event.target.parentNode;
    parentElement.querySelector('input').click() ;       
}

// step2
let croppedArea1;
let croppedArea2;
let croppedArea3;
function fileSelected(event,image){
    const input = event.target;
    const imageFile = input.files[0];       
    if(!imageFile.type.startsWith('image/')){
        let errorTag = event.target.parentElement.querySelector('.error');
        errorTag.innerText = 'Invalid File Format';
        input.value = ''
        setTimeout(function(){
            errorTag.innerText = '';
        },2500)
    }
    else{
        input.parentElement.querySelector('.error').innerText = '' 
        const preview = input.parentElement.querySelector('.preview');
        const cropButton = input.parentElement.querySelector('.crop');
        cropButton.style.display = 'block'

        let existingCropBox = input.parentElement.querySelector('.preview #crop-box');
        if(existingCropBox){
            preview.removeChild(existingCropBox)
        }

        let cropBox = document.createElement('div');
        cropBox.id = 'crop-box'

        let img = document.createElement('img');
        let imageURL = URL.createObjectURL(imageFile);
        img.src = imageURL;

        if(image === 'image1'){
            if(croppedArea1){
                croppedArea1.destroy()
            }
            croppedArea1 = new Cropper(img,{
                aspectRatio:0.8,
                viewMode:5
            })
        }
        else if(image === 'image2'){
            if(croppedArea2){
                croppedArea2.destroy()
            }
            croppedArea2 = new Cropper(img,{
                aspectRatio:0.8,
                viewMode:5
            })
        }
        else if(image === 'image3'){
            if(croppedArea3){
                croppedArea3.destroy()
            }
            croppedArea3 = new Cropper(img,{
                aspectRatio:0.8,
                viewMode:5
            })
        }
        cropBox.appendChild(img);
        preview.appendChild(cropBox)
    }
    
}

// step3
let images = {
    image1:'',
    image2:'',
    image3:''
}
async function cropTheImage(event,image){
    event.preventDefault()
    let croppedImage;
    switch(image){
        case 'image1':
            croppedImage = croppedArea1.getCroppedCanvas({
                width:300,
                height:300
            })
            break;
        case 'image2':
            croppedImage = croppedArea2.getCroppedCanvas({
                width:300,
                height:300
            })
            break;
        case 'image3':
            croppedImage = croppedArea3.getCroppedCanvas({
                width:300,
                height:300
            })
    }
    
    const parentElement = event.target.parentElement;
    // hide image cropping view and other elements
    parentElement.querySelector('.preview #crop-box').style.display = 'none';
    parentElement.querySelector('.crop').style.display = 'none'
    parentElement.querySelector('.add-image').style.display = 'none'

    // preview the cropped image
    const croppedPreview = parentElement.querySelector('.cropped-preview');

    const existingCroppedPreviewBox = parentElement.querySelector('.cropped-preview .cropped-preview-box');
    if(existingCroppedPreviewBox){
        croppedPreview.removeChild(existingCroppedPreviewBox)
    }

    const croppedPreviewBox = document.createElement('div');
    croppedPreviewBox.classList = 'cropped-preview-box';

    const img = document.createElement('img');
    const croppedImageURL = croppedImage.toDataURL('image/png');
    const imageBinaryURL = await convertToBinary(croppedImageURL);
    images[image] = imageBinaryURL;
    console.log(images);
    img.src = croppedImageURL;


    const deleteButton = document.createElement('button');
    deleteButton.classList = 'delete-button';
    deleteButton.innerHTML = '<i class="fa-solid fa-xmark fa-flip-vertical"></i>'
    deleteButton.addEventListener('click',function(event){
        event.preventDefault()
        croppedPreview.removeChild(croppedPreviewBox);        
        images[image] = ''
        parentElement.querySelector('input').value = ''
        parentElement.querySelector('.add-image').style.display = 'block'
        console.log(images);

    })

    const editButton = document.createElement('button');
    editButton.classList = 'edit-button';
    editButton.innerHTML = '<i class="fa-solid fa-crop"></i>'
    editButton.addEventListener('click',function(event){
        event.preventDefault()
        parentElement.querySelector('.cropped-preview .cropped-preview-box').style.display = 'none';
        parentElement.querySelector('.preview #crop-box').style.display = 'block';
        parentElement.querySelector('.crop').style.display = 'block';
    })

    croppedPreviewBox.appendChild(img);
    croppedPreviewBox.appendChild(deleteButton);
    croppedPreviewBox.appendChild(editButton)
    croppedPreview.appendChild(croppedPreviewBox)

}

// converting cropped image to binary data.
async function convertToBinary(imageURL){    
    const response = await fetch(imageURL);
    const blob = await response.blob();    
    return blob;   
}

// submitting the values
let validated = true;
const form = document.getElementById('product-form');
form.addEventListener('submit',async function(event){
    event.preventDefault();
    const inputs = document.querySelectorAll('input');
    const category = document.getElementById('category');
    inputs.forEach(function(input){
        if(input.value === ''){
            input.parentElement.querySelector('.error').innerText = '*Data Required'
            validated = false
        }
    })
    if(category.value === ''){
        category.parentElement.querySelector('.error').innerText = '*Data Required';
        validated = false
    }     
    if(validated){
        const formData = new FormData()
        const category = document.getElementById('category')
        const inputs = document.querySelectorAll('.input');
        inputs.forEach(function(input){
            if(input.name != undefined){
                formData.append(input.name,input.value);
            }
        })
        formData.append(category.name,category.value)
        for(let key in images){
            formData.append('images',images[key])
        }
        try{
            const response = await fetch('/admin/addNewProduct',{
                method:'POST',
                body:formData
            })
            if(response.ok){
                console.log('product added');
                window.location.href = '/admin/products' 
            }
            else{
                console.log('failed to add product');
                window.location.href = '/admin/products'
            }
        }
        catch(error){
            console.log('some error occured in adding product to db',error);
            window.location.href = '/admin/products'
        }
    }
})


