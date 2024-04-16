const form = document.querySelector('#form');
form.addEventListener('submit',function(event){
    event.preventDefault();
    document.querySelectorAll('.input').forEach(function(input){
        if(input.value.length === 0){
            input.parentNode.querySelector('p').style.display = 'block'
        }
    })

})

document.querySelectorAll('.input').forEach(function(input){
    input.addEventListener('keyup',function(event){
        if(input.value.length > 0){
            input.parentNode.querySelector('p').style.display = 'none'
        }
        else{
            input.parentNode.querySelector('p').style.display = 'block'
        }
    })
})

document.addEventListener('DOMContentLoaded',async function(){
    const select_category = document.getElementById('category').value;
    try{
        const response = await fetch('/admin/getProducts',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({category:select_category})
        })
        if(response.ok){
            const selectElement = document.querySelector('#product')
            const data = await response.json();
            data.products.forEach(function(product){
                console.log(product);
                const option = document.createElement('option');
                const div = document.createElement('div') ;
                div.classList.add('productDiv');

                div.innerHTML = `
                <div class='image'>
                    <img src='${product.images[0]}' alt='product image'>
                </div>
                <div class='brand'>${product.brand}</div>
                <div class='sellingPrice'>${product.sellingPrice}</div>
                `
                
                option.value = product._id
                option.appendChild(div)
                selectElement.appendChild(option)
            })
        }
    }
    catch(error){
        console.log("error when fetching category based products from server",error);
    }
})