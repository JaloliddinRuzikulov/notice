// External test function
function externalFunction() {
    alert('External function works!');
    document.getElementById('result').innerHTML += '<p>External function executed at ' + new Date().toLocaleTimeString() + '</p>';
}

console.log('External script loaded successfully');