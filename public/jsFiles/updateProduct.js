const croppedFilesP1 = [];
const croppedFilesP2 = []
const croppedFilesP3 = []


async function changeImage(event,previewID,fileInput){
    event.preventDefault();
    const file = event.target.files[0];
    const fileType = file.type;

    if(!fileType.startsWith('image/')){
        event.target.value = '';
        window.alert("invalid file format")
    }
    else{
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async function(read){
            const image = document.getElementById(previewID);
            image.src = read.target.result;

            const croppedImage = await cropImage(file,fileInput);
            switch(fileInput){
                case 'image1':
                    if(croppedFilesP1.length > 1){
                        croppedFilesP1.shift();
                    }
                    break;
                case 'image2':
                    if(croppedFilesP2.length > 1){
                        croppedFilesP2.shift();
                    }
                    break; 
                case 'image3':
                    if(croppedFilesP3.length > 1){
                        croppedFilesP3.shift();
                    }
                    break;      
                        
            }
            image.src = croppedImage;
        }
    }
}



async function cropImage(file,fileInput){
    const formData = new FormData();
    formData.append('image',file);

    try{
        const response = await fetch('/admin/crop-image',{
            method:'POST',
            body:formData
        })
        if(!response.ok){
            console.log('failed to crop the image');
        }
        const croppedImageBlob = await response.blob();
        const imageURL = URL.createObjectURL(croppedImageBlob);

        switch (fileInput){
            case 'image1':
                croppedFilesP1.push(croppedImageBlob);
                break;
            case 'image2':
                croppedFilesP2.push(croppedImageBlob);
                break;
            case 'image3':
                croppedFilesP3.push(croppedImageBlob);
                break;
        }        
        return imageURL

    }
    catch(error){

    }

}

const updateFormButton = document.querySelector("#updateForm");
async function submitForm(event,productID){
    event.preventDefault();
    const inputFields = document.querySelectorAll('.input');
    let validated = true;

    inputFields.forEach(function(field){
        if(field.value === ''){
            const parentnode = field.parentNode;
            const errorTag = parentnode.querySelector("p.error");
            errorTag.innerText = '*Required Field';
            validated = false;
        }
        else if(field.value < 0){
            field.parentNode.querySelector('p.error').innerText = 'Invalid Format';
            validated = false;
        }  
    })
    if(validated){
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

            // fromData leftside
            formData.append('sleeve',sleeve.value);
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
            
            // images 1 2 3
            formData.append('image1',croppedFilesP1[0]);
            formData.append('image2',croppedFilesP2[0]);
            formData.append('image3',croppedFilesP3[0]);

            const response = await fetch(`/admin/update-product/${productID}`,{
                method:'POST',
                body:formData
            })
            if(!response.ok){
                console.log("product failed to update");
                window.location.href = '/admin/products'
            }
            console.log("product succesfully updated");
            window.location.href = '/admin/products'
        }
        catch(error){
            console.log("failed to update the product!");
        }
    }

}

// onkeyup event
const inputFields = document.querySelectorAll('.input');
inputFields.forEach(function(field){
    field.addEventListener('keyup',function(){
        if(field.value.length !=0){
            field.parentNode.querySelector('p.error').innerText = ''
        }
        else{
            field.parentNode.querySelector('p.error').innerText = '*Required Field'
        }
    })
})
