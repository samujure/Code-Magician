let history = [];
let currentHistoryIndex = -1;
let path = "C:\\Users\\edmun\\Desktop\\VSCode Projects\\Code-Magician\\templates\\my-app\\src\\App.tsx";

    // Save Edit functionality
    function saveEdit() {
        const content = document.getElementById('code-area').value;
        console.log('Saving edit:', path, content);

        window.electron.sendEvent('save-edit', { path, content });
    }

    // Toggle Code Editor
    function toggleCodeEditor() {
        const elem = document.getElementById('code-editor');
        elem.style.display = elem.style.display === 'none' ? 'block' : 'none';
    }

    // Toggle Edit Mode
    function toggleEditMode() {
        const elem = document.getElementById('edit-btn');
        elem.style.backgroundColor = elem.style.backgroundColor === 'red' ? 'green' : 'red';
        window.electron.sendEvent('toggle-edit-mode');
    }

    // Simulate Device Size in Renderer
    function simulateSize(device) {
        console.log('Changing size renderer:', device);
        window.electron.sendEvent('change-size', { device });
    }

    // Submit Project Directory
    function submitProjectDir() {
        const input = document.getElementById('project-dir-input');
        const projectDir = input.value.trim();  // Get the trimmed input value

        if (projectDir) {
            // Update the UI to show the selected project directory
            document.getElementById('project-display').textContent = `Project Directory: ${projectDir}`;

            // Send the project directory to the main process if needed
            window.electron.sendEvent('set-project-dir', projectDir);
        } else {
            alert("Please enter a valid project directory path.");
        }
    }

    // Send Input Operation
    function sendInput(operation) {
        if (!path) {
            alert('Please select a component first.');
            return;
        }
    
        const input = document.getElementById('text-input').value;
        document.getElementById('text-input').value = '';  // Clear the input field
        console.log('Sending input:', operation, input, path);
        window.electron.sendEvent('input-event', { operation, input, path });
    }

    // Toggle Floating Window
    function toggleFloatingWindow() {
        const elem = document.getElementById('floating-window');
        elem.style.display = elem.style.display === 'none' ? 'block' : 'none';
    }

    // Undo Action
    function undoAction() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            // Restore state based on new currentHistoryIndex
            const previousContent = history[currentHistoryIndex];
            document.getElementById('code-area').value = previousContent;
        }
    }

    // Redo Action
    function redoAction() {
        if (currentHistoryIndex < history.length - 1) {
            currentHistoryIndex++;
            // Restore state based on new currentHistoryIndex
            const nextContent = history[currentHistoryIndex];
            document.getElementById('code-area').value = nextContent;
        }
    }

    // Publish Edit
    function publishEdit() {
        console.log('Publishing edit:', path);
        window.electron.sendEvent('publish', { path });
    }

    // Dynamic resizing of search input and iframe
    const searchInput = document.getElementById('search-input');
    const previewWindow = document.getElementById('preview-window');

    searchInput.addEventListener('input', function () {
        // Reset height to get the new scroll height
        this.style.height = 'auto';

        // Calculate the new height based on the scroll height
        const newHeight = Math.min(this.scrollHeight, window.innerHeight * 0.3); // 30% of viewport height
        this.style.height = `${newHeight}px`;

        // Adjust iframe height based on textarea height
        adjustIframeHeight(newHeight);
    });

    function adjustIframeHeight(inputHeight) {
        // Calculate the remaining height for the iframe after input box grows
        const remainingHeight = window.innerHeight - inputHeight - document.getElementById('input-bar').offsetHeight - 50; // Adjust for buttons and padding
        previewWindow.style.height = `${remainingHeight}px`;
    }

    // Initial size adjustment on load
    window.addEventListener('load', function () {
        searchInput.style.height = 'auto'; // Reset height
        searchInput.dispatchEvent(new Event('input')); // Trigger input event to set initial height
    });

    // Handle window resizing dynamically for prompt and iframe
    window.addEventListener('resize', function () {
        searchInput.dispatchEvent(new Event('input')); // Trigger input event to adjust sizes dynamically
    });

    // Handle Component Selection
    window.electron.receiveEvent('component-selected', (event, data) => {
        if (data.exists === false || data.error) {
            console.error('Error selecting component:', data);
            document.getElementById('component-display').textContent = 'Component: No component selected';
            document.getElementById('toggle-code-btn').style.display = 'none';
            document.getElementById('code-area').style.display = 'none';
            return;
        }

        const name = data.path.split('\\').pop();
        const content = data.content || 'No content';
        path = data.path;

        document.getElementById('component-display').textContent = 'Component: ' + name;
        document.getElementById('toggle-code-btn').style.display = 'block';
        document.getElementById('code-area').style.display = 'block';
        document.getElementById('code-area').textContent = content;

        // Save the component's current state in history for undo/redo
        history.push(content);
        currentHistoryIndex = history.length - 1;
    });

    // Handle Component List Population
    window.electron.receiveEvent('components', (event, data) => {
        console.log('Received components:', data);
        const nameListContainer = document.getElementById('name-list');
        nameListContainer.innerHTML = ''; // Clear existing buttons

        data.forEach(item => {
            const button = document.createElement('button');
            button.textContent = item.name;
            button.className = 'name-btn';
            button.onclick = function() {
                console.log('Selected component:', item.path);
                window.electron.sendEvent('select-component', { path: item.path });
            };
            nameListContainer.appendChild(button);
        });
    });

    // Add event listeners for input focus
    document.getElementById('project-dir-input').addEventListener('click', () => {
        document.getElementById('project-dir-input').focus();
    });

    document.getElementById('text-input').addEventListener('click', () => {
        document.getElementById('text-input').focus();
    });
