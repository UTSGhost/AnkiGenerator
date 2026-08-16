document.getElementById("upload-form").addEventListener("submit", displayLoad);

async function displayLoad(event){
    // prevents POST request to flask directly
    event.preventDefault();
    // activate loader
    document.getElementById("loader").style.display = "block";
    // delete any previous error messages
    document.getElementById("error").innerHTML = "";
    // formData is the form element
    const formData = new FormData(event.target)
    try {
        // send POST to flask
        const response = await fetch("/", {
            method: "POST",
            body: formData
        });
        // if flask throws error
        if (!response.ok) {
            const error_message = await response.text();
            throw new Error(`${error_message} with Response Status: ${response.status}`);
        }
        // create blob for download
        const fileBlob = await response.blob();
        const url = window.URL.createObjectURL(fileBlob);

        // make temporary link for user to download file
        var a = document.createElement('a');
        a.href = url;
        a.download = "deck.apkg";
        document.body.appendChild(a);
        a.click();    
        a.remove();
        // free mem
        window.URL.revokeObjectURL(url)
    } catch (error) {
        // display error
        document.getElementById("error").innerHTML = error;
    } finally {
        document.getElementById("loader").style.display = "none";
    }
}
