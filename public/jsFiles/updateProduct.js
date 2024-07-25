let images = {
    image0:'',
    image1:'',
    image2:''
}
// taking the default images
document.addEventListener('DOMContentLoaded',async function(event){
    
    const tags = document.querySelectorAll('.cropped-preview img');
    const imageURLs = Array.from(tags).map(async function(tag){
        let response = await fetch(tag.src);
        let blob = await response.blob();
        return blob
    })
    const imageBlobs = await Promise.all(imageURLs);
    
    let index = 0;
    for(let image in images){
        images[image] = imageBlobs[index];
        index += 1;
    }
    console.log('images: ',images);
})

// deleting product
function deletePreview(event,imageID){
    event.preventDefault();
    const imageContainer = document.querySelector(`.image-section[data-imageid='${imageID}']`);    
    const croppedPreview = imageContainer.querySelector('.cropped-preview');
    const croppedPreviewImg = imageContainer.querySelector('.cropped-preview img');
    imageContainer.querySelector('input[type="hidden"]').value = ''
    croppedPreviewImg.src = ''
    croppedPreview.style.display = 'none'

    const addImageButton = imageContainer.querySelector('.select-image');
    addImageButton.style.display = 'block'
}

// selecting file
function selectFile(event,imageID){
    event.preventDefault()
    const imageSection = document.querySelector(`.image-section[data-imageid='${imageID}']`);
    const imageInput = imageSection.querySelector('#file-input');
    imageInput.click()
}


// preview for cropping image and cropping the image
function previewForCrop(event,imageID){
    event.preventDefault();
    const imageSection = document.querySelector(`.image-section[data-imageid='${imageID}']`);  
    const file = imageSection.querySelector('#file-input').files[0];

    if(!file.type.startsWith('image/')){
        const error = imageSection.querySelector('.error');
        error.innerText = '*Invalid File Format';
        imageSection.querySelector('#file-input').value = ''
        setTimeout(function(){
            error.innerText = ''
        },3000)
    }
    else{
        event.target.parentElement.querySelector('.error').innerText = ''
        const fileButton = imageSection.querySelector('.select-image');
        fileButton.style.display = 'none';

        let croppedArea;

        const imagePreview = imageSection.querySelector('.selected-preview');
        imagePreview.style.display = 'block'

        const existingCropBox = imageSection.querySelector('.selected-preview .cropping-box');
        if(existingCropBox){
            imagePreview.removeChild(existingCropBox)
        }

        const cropBox = document.createElement('div');
        cropBox.classList = 'cropping-box';
        
        const img = document.createElement('img');
        const imageURL = URL.createObjectURL(file);
        img.src = imageURL

        if(croppedArea){
            croppedArea.destroy();
        }
        croppedArea = new Cropper(img,{
            aspectRatio:0.8,
            viewMode:5
        })

        cropBox.appendChild(img)
        imagePreview.appendChild(cropBox)

        const cropButton = imageSection.querySelector('.crop-button');
        cropButton.style.display = 'block'

        // crop button clicked
        cropButton.addEventListener('click', async function(event){
            event.preventDefault();
            event.target.parentElement.querySelector('input[type="hidden"]').value = 'image added'
            

            const croppedImage = croppedArea.getCroppedCanvas({
                width:300,
                height:300
            })
            const croppedImageURL = croppedImage.toDataURL('image/png');

            const parentElement = event.target.parentElement;
            const selectedImagePreview = parentElement.querySelector('.selected-preview');
            const cropButton = parentElement.querySelector('.crop-button')

            const croppedPreview = parentElement.querySelector('.new-cropped-preview');

            const existingPreviewBox = parentElement.querySelector('.new-cropped-preview .new-preview-box');
            if(existingPreviewBox){
                croppedPreview.removeChild(existingPreviewBox)
            }

            let newPreviewBox = document.createElement('div');
            newPreviewBox.classList = 'new-preview-box';

            let img = document.createElement('img');
            img.src = croppedImageURL;
            const blobData = await convertToBlob(croppedImageURL);
            images[imageID] = blobData;


            let deleteButton = document.createElement('button');
            deleteButton.classList = 'delete-button';
            deleteButton.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            deleteButton.addEventListener('click',function(event){
                event.preventDefault();
                croppedPreview.removeChild(newPreviewBox);
                imageSection.querySelector('input[type="hidden"]').value = ''
                fileButton.style.display = 'block';
            })

            let editButton = document.createElement('button');
            editButton.classList = 'crop-button';
            editButton.innerHTML = '<i class="fa-solid fa-crop"></i>'
            editButton.addEventListener('click',function(event){
                event.preventDefault();

            })


            selectedImagePreview.style.display = 'none'
            cropButton.style.display = 'none'

            newPreviewBox.appendChild(img);
            newPreviewBox.appendChild(deleteButton);
            newPreviewBox.appendChild(editButton)
            croppedPreview.appendChild(newPreviewBox)

        })
    }    
}

// extract the image into a blob object;
async function convertToBlob(imageURL){
    const response = await fetch(imageURL);
    const blob = await response.blob();
    return blob;
}

// submitting File
async function submitForm(event,productID){
    event.preventDefault();

    let validated = true;
    const inputsFields = document.querySelectorAll('.input');
    const numInputs = document.querySelectorAll('input[type="number"]')
    const category = document.getElementById('category');
    inputsFields.forEach(function(input){
        if(input.value.trim('').length === 0){
            input.parentElement.querySelector('.error').innerText = '*Data Required';
            validated = false;            
        }
    })
    if(category.value === ''){
        category.parentElement.querySelector('.error').innerText = '*Data Required';
        validated = false;
    }
    numInputs.forEach(function(input){
        if(input.value < 0){
            input.parentElement.querySelector('.error').innerText = 'Requires only positive numbers';
            validated = false;
            // setTimeout(function(){
            //     input.parentElement.querySelector('.error').innerText = '';
            // },2000)            
        }
    })
    if(validated){
        const formData = new FormData();
        const category = document.getElementById('category');
        const inputs = document.querySelectorAll('.input');
        inputs.forEach(function(input){
            if(input.name != undefined && input.name != 'unknown'){
                formData.append(input.name,input.value);
                console.log(`${input.name} : ${input.value}`);
            }
        })
        formData.append(category.name,category.value);
        formData.append('image1',images.image0);
        formData.append('image2',images.image1);
        formData.append('image3',images.image2);

        console.log('formData: ',formData);

        // submit the form
        try{
            const response = await fetch(`/admin/update-product/${productID}`,{
                method:'PATCH',
                body:formData
            })
            if(response.ok){
                console.log('product uploaded successfull');
                window.location.href = '/admin/products'
            }
            else{
                console.log('product uploaded failed');
                window.location.href = '/admin/products'
            }
        }
        catch(error){
            console.log('error when editing product',error);
            window.location.href = '/admin/products'
        }
    }
}