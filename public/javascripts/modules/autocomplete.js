function autocomplete(input, latInput, lngInput){
    //console.log(input, latInput, lngInput);
    if(!input) return; // skip this fn from running if there is no input on the page
    // google api for address autocomplete
    const dropdown = new google.maps.places.Autocomplete(input);
    // google event listener fn
    dropdown.addListener('place_changed', () => {
        const place = dropdown.getPlace();
        // console.log(place);
        latInput.value = place.geometry.location.lat();
        lngInput.value = place.geometry.location.lng();
    });
    // if someone hit enters
    input.on('keydown', (e) => {
        if(e.keyCode === 13) e.preventDefault();
    });

}

export default autocomplete;