document.addEventListener("DOMContentLoaded",function(){
    const bannerDeleteButtons = document.querySelectorAll(".deleteBanner");
    bannerDeleteButtons.forEach(function(button){
        button.addEventListener('click',async function(event){
            event.preventDefault();
            const bannerID = button.dataset.bannerid;
            const elementToRemove = button.parentElement.parentElement;
            const confirmed = await deleteConfirmation();            
            if(confirmed.value){
                deleteBanner(bannerID,elementToRemove);
            }
        })
    })
});

async function deleteConfirmation(){
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

async function deleteBanner(bannerID,element){
    try{
        const deleteResponse = await fetch(`/admin/deleteBanner/${bannerID}`,{
            method:'POST',
        })
        const data = await deleteResponse.json();
        if(data.message){
            console.log("banner deleted");
            element.remove()
        }
        else{
            console.log("failed to delete banner");
        }
    }
    catch(error){
        console.log("error occured when deleteing the banner",error);
    }
}

