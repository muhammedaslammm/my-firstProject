// main product image
const croppedImageFiles = []
const mainPreviewContainer = document.getElementById('main-image-preview');
const previewBox = document.querySelector('#main-image-preview div')

async function cropAndPreviewImage(fileEvent){
    const file = fileEvent.target.files[0];
    const fileType = file.type;
    if(!fileType.startsWith('image/')){
        document.querySelector('.main-error').innerText = 'invalid file format';
        fileEvent.target.value = ''
        setTimeout(function(){
            document.querySelector('.main-error').style.display = 'none';
        },2500)
    }
    else{
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async function(read){

            const previewBox = document.createElement('div');
            previewBox.classList.add('preview-box');

            const image = document.createElement('img');            
            image.src = read.target.result;

            const croppedImage = await cropImage(file);
            image.src = croppedImage;

            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'x';
            deleteButton.classList.add('delete-button');
            

            deleteButton.addEventListener('click',function(event){
                event.preventDefault();
                mainPreviewContainer.removeChild(previewBox);
                fileEvent.target.value = ''     
            })
            
            previewBox.appendChild(image);
            previewBox.appendChild(deleteButton);
            const isExisting = mainPreviewContainer.querySelector('.preview-box');
            if(isExisting){
                mainPreviewContainer.removeChild(isExisting);
                mainPreviewContainer.appendChild(previewBox)
            }
            else{
                mainPreviewContainer.appendChild(previewBox)
            }
        }
    }
}

// subImages
const subPreviews = document.querySelector('#image-previews');
const error = document.querySelector('.sub-error');
const subfileInput = document.querySelector('#sub-image-fileInput')
const addImageButton = document.querySelector('#add-images')
const inputFiles = []


function cropAndPreviewSubImages(subFileEvent){    
    const files = subFileEvent.target.files;
    let validFormat = true;
    const inputLimit = 2

    // checking file formats
    for(let i=0; i<files.length; i++){
        const fileType = files[i].type;
        if(!fileType.startsWith('image/')){
            validFormat = false;
            error.style.display = 'block'
            error.innerText = 'invalid file format detected'
            setTimeout(function(){
                error.style.display = 'none'
            },2500)
            break
        }
    }

    if(validFormat){
        for(let i=0; i<files.length; i++){            
            inputFiles.push(files[i]);
            if(inputFiles.length > inputLimit){
                inputFiles.splice(i,1);
                console.log(inputFiles);
                error.style.display = 'block';
                error.innerText = 'sub images requires only 2 images';
                setTimeout(function(){
                    error.style.display = 'none';
                    error.innerText = '';
                },2500)
                break
            }
            const reader = new FileReader();
            reader.readAsDataURL(files[i]);
            reader.onload = async function(read){
                const previewBox = document.createElement('div');
                previewBox.classList.add('sub-preview-box');

                const image = document.createElement('img');
                image.src = read.target.result;              

                const croppedImage = await cropImage(files[i])
                const blobIdentifier = croppedImageFiles.length;
                image.src = croppedImage;
                
                const deleteButton = document.createElement('button');
                deleteButton.innerText = 'x';
                deleteButton.classList.add('subDelete-button')

                deleteButton.addEventListener('click',function(event){
                    subPreviews.removeChild(previewBox);                     
                    inputFiles.splice(files[i],1);
                    console.log(inputFiles);
                    deleteBlob(blobIdentifier);

                })

                previewBox.appendChild(image);
                previewBox.appendChild(deleteButton);
                subPreviews.appendChild(previewBox);
            }
        }
    }

}
addImageButton.addEventListener('click',function(event){
    event.preventDefault();
    subfileInput.click();    
})
// delete blob
function deleteBlob(blobIdentifier){
    const matchedBlob = croppedImageFiles.findIndex(function(file){
        return file.identifier === blobIdentifier
    })

    if(matchedBlob){
        croppedImageFiles.splice(matchedBlob,1);
    }
}



// crop image
async function cropImage(file){
    const formData = new FormData();
    formData.append('image',file);

    try{
        const response = await fetch('/admin/crop-image',{
            method:'POST',
            body:formData
        })
        if(!response.ok){
            console.log("response error");
        }
        const croppedImageBlob = await response.blob();
        const croppedImageURL = URL.createObjectURL(croppedImageBlob);
        croppedImageFiles.push({blob:croppedImageBlob,identifier:croppedImageFiles.length});
        return croppedImageURL;
    }
    catch(error){
        console.log('API error in cropping');
        return ''
    }
}

const productForm = document.querySelector("#product-form");
productForm.addEventListener('submit',async function(event){
    event.preventDefault();
    let fieldVerified = true;
    let mainImageVerified = true;
    let subImageVerified = true;
    const fields = document.querySelectorAll('.input');
    fields.forEach(function(field){
        if(field.value === ''){
            const parentnode = field.parentNode;
            const error = parentnode.querySelector('p.error');
            error.innerText = '*Field Required'
            fieldVerified = false;
        }if(field.value < 0 || field.value === NaN){
            field.parentNode.querySelector('p.error').innerText = 'Invalid Entry';
            fieldVerified = false;
        }
    })

    //main image file 
    const mainImage = document.querySelector("#main-image");
    if(mainImage.value.length === 0){
        const parentnode = mainImage.parentNode ;
        const error = parentnode.querySelector('p.main-error');
        error.innerText = '*Image file required';
        mainImageVerified = false
        
    }
    else{
        const parentnode = mainImage.parentNode ;
        const error = parentnode.querySelector('p.main-error');
        error.innerText = ''
        mainImageVerified = true
    }

    // sub image file
    const subImage = document.querySelector('#sub-image-fileInput');
    const error = subImage.parentNode.querySelector('.sub-error');
    if(inputFiles.length < 2){
        error.innerText = '*2 Files Required';
        subImageVerified = false;
    }
    else{
        subImageVerified = true
    }

// submitting file
    if(fieldVerified && mainImageVerified && subImageVerified){
        const sleeve = document.querySelector('input[name="sleeve"]');
        const fit = document.querySelector('input[name="fit"]');
        const pattern = document.querySelector('input[name="pattern"]');
        const wash = document.querySelector('input[name="wash"]');
        const color = document.querySelector('input[name="color"]');
        const fabric = document.querySelector('input[name="fabric"]');
        const brand = document.querySelector('input[name="brand"]');
        const productType = document.querySelector('input[name="productType"]');
        const actualPrice = document.querySelector('input[name="actualPrice"]');
        const sellingPrice = document.querySelector('input[name="sellingPrice"]');
        const category = document.querySelector('#category');
        const status = document.querySelector('input[name="status"]');
        const extra_small = document.querySelector('input[name="extra_small"]');
        const small = document.querySelector('input[name="small"]');
        const medium = document.querySelector('input[name="medium"]');
        const large = document.querySelector('input[name="large"]');
        const extra_large = document.querySelector('input[name="extra_large"]');
        const extra_extra_large = document.querySelector('input[name="extra_extra_large"]');
        const date = document.querySelector('input[name="date"]');

        try{
            const formData = new FormData();
            // form left
            formData.append('sleeve',sleeve.value)
            formData.append('fit',fit.value);  
            formData.append('pattern',pattern.value);  
            formData.append('wash',wash.value);  
            formData.append('color',color.value);  
            formData.append('fabric',fabric.value);  

            // formData right
            formData.append('brand',brand.value);  
            formData.append('productType',productType.value);  
            formData.append('actualPrice',actualPrice.value);  
            formData.append('sellingPrice',sellingPrice.value);
            formData.append('category',category.value);  
            formData.append('status',status.value);  
            formData.append('date',date.value)
            
            // sizes
            formData.append('extra_small',extra_small.value);  
            formData.append('small',small.value);  
            formData.append('medium',medium.value);  
            formData.append('large',large.value);  
            formData.append('extra_large',extra_large.value);  
            formData.append('extra_extra_large',extra_extra_large.value);
            
            // images
            for(let file of croppedImageFiles){
                formData.append('images',file.blob);
            }

            // api request
            const response = await fetch('/admin/addNewProduct',{
                method:'POST',
                body:formData
            })
            if(response.ok){
                console.log('product created successfully');
                window.location.href = '/admin/products'
            }
            else{
                console.log('product creation failed!')
                window.location.href = '/admin/products'
            }
         }
         catch(error){
             console.log("error when submitting product",error);
         }
    }
    
    
})

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


