async function deleteProduct(event,productID){
    event.preventDefault();
    const trigerredElement = event.target.parentElement.parentElement;
    const result = await confirmDeletion();    
    if(result.isConfirmed){        
        deleteTheProduct(productID,trigerredElement);
    }
}

async function confirmDeletion(){
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'You are about to delete this banner!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
    })   
    return result; 
}

async function deleteTheProduct(productID,element){
    try{
        const response = await fetch(`/admin/product-delete/${productID}`,{
            method:'POST'
        })
        const data = await response.json();
        if(data.message === 'product deleted'){
            element.remove();
            console.log("product deleted");
        }
        else{
            window.alert('The products that are on "payment pending" and "delivery on progress", cannot be deleted by the admin !')
        }
    }
    catch(error){
        console.log(error,"error when deleting the product");
    }
}