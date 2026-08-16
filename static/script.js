document.getElementById("upload-form").addEventListener("submit", displayLoad);

async function displayLoad(event){
    event.preventDefault();
    document.getElementById("loader").style.display = "block";
    const formData = new FormData(event.target)
    try {
        const response = await fetch("/", {
            method: "POST",
            body: formData
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const fileBlob = await response.blob();
        const url = window.URL.createObjectURL(fileBlob);

        var a = document.createElement('a');
        a.href = url;
        a.download = "deck.apkg";
        document.body.appendChild(a);
        a.click();    
        a.remove();
        window.URL.revokeObjectURL(url)
    } catch (error) {
        console.error(error.message);
    } finally {
        document.getElementById("loader").style.display = "none";
    }
}
