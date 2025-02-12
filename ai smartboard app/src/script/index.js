document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("whiteboard");
    const ctx = canvas.getContext("2d");
    const colorPicker = document.getElementById("color-picker");
    const shapesTool = document.getElementById("shapes-tool");
    const speakButton = document.getElementById("start-speaking");
    const penTool = document.getElementById("pen-tool");
    const eraseTool = document.getElementById("erase-tool");
    const clearBoardTool = document.getElementById("clear-board");

    let drawing = false;
    let erasing = false;
    let currentColor = "black";
    let currentShape = null;
    let isSpeaking = false;
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = currentColor;

    // Fix cursor alignment and smooth drawing
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    canvas.addEventListener("mousedown", (e) => {
        drawing = true;
        const pos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!drawing) return;
        const pos = getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    });
    

    canvas.addEventListener("mouseup", () => {
        drawing = false;
        ctx.beginPath();
    });
    
    // Pen Tool Functionality
    penTool.addEventListener("click", () => {
        erasing = false;
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = 2;
    });

    // Eraser Tool Functionality
    eraseTool.addEventListener("click", () => {
        erasing = true;
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = 20;
    });

    // Color Picker Functionality
    colorPicker.addEventListener("click", () => {
        const colorPalette = document.createElement("input");
        colorPalette.type = "color";
        document.body.appendChild(colorPalette);

        colorPalette.addEventListener("input", (event) => {
            currentColor = event.target.value;
            ctx.strokeStyle = currentColor;
        });
        colorPalette.addEventListener("blur", () => {
            document.body.removeChild(colorPalette);
        });
    });

    // Shapes Tool Functionality
    shapesTool.addEventListener("click", () => {
        const shapeMenu = document.createElement("div");
        shapeMenu.classList.add("shape-menu");
        shapeMenu.innerHTML = `
            <button id='rect'>⬛</button>
            <button id='circle'>⚫</button>
            <button id='triangle'>🔺</button>
        `;
        document.body.appendChild(shapeMenu);

        document.getElementById("rect").addEventListener("click", () => {
            currentShape = "rectangle";
            drawShape("rectangle");
        });
        document.getElementById("circle").addEventListener("click", () => {
            currentShape = "circle";
            drawShape("circle");
        });
        document.getElementById("triangle").addEventListener("click", () => {
            currentShape = "triangle";
            drawShape("triangle");
        });
    });

    function drawShape(shape) {
        ctx.fillStyle = currentColor;
        if (shape === "rectangle") {
            ctx.fillRect(50, 50, 100, 50);
        } else if (shape === "circle") {
            ctx.beginPath();
            ctx.arc(100, 100, 40, 0, Math.PI * 2);
            ctx.fill();
        } else if (shape === "triangle") {
            ctx.beginPath();
            ctx.moveTo(100, 50);
            ctx.lineTo(50, 150);
            ctx.lineTo(150, 150);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Speak Button Functionality
    speakButton.addEventListener("click", () => {
        isSpeaking = !isSpeaking;
        speakButton.style.backgroundColor = isSpeaking ? "green" : "red";
    });
    
    // Clear Button Functionality
    clearBoardTool.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });


    
// Speech-to-Text
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.continuous = true;
speechOn = false;
speakButton.addEventListener("click", () => {
    if (!speechOn) {
        recognition.start();
        speechOn = true;
    } else {
        recognition.stop();
        speechOn = false;
    }
});

recognition.onresult = (event) => {
    let latestText = event.results[event.results.length - 1][0].transcript;
    
    let textContainer = document.getElementById("text-container");

    // Create an editable text element
    let textElement = document.createElement("div");
    textElement.className = "transcribed-text";
    textElement.innerText = latestText;
    textElement.contentEditable = true; // Make text editable

    // Save text when pressing Enter (prevent new line)
    textElement.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            textElement.blur();
        }
    });

    // Append text to the container
    textContainer.appendChild(textElement);

    // Auto-scroll to the bottom
    textContainer.scrollTop = textContainer.scrollHeight;
};

});
