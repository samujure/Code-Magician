const {
	app,
	BrowserWindow,
	ipcMain,
	WebContentsView,
	screen,
} = require("electron");
const path = require("node:path");
const fs = require("fs");
const axios = require("axios");

let projectDir = "C:\\Users\\edmun\\Desktop\\VSCode Projects\\Code-Magician\\templates\\my-app\\src\\App.tsx"; // Variable to store the project directory path
let translatedX = 0;
let translatedY = 0;

const createWindow = () => {
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;

	const win = new BrowserWindow({
		width,
		height,
		transparent: true,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: true,
			contextIsolation: true,
		},
		backgroundColor: "gray",
	});

	win.maximize();

	const view = new WebContentsView({
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
			backgroundThrottling: false,
		},
	});
	win.contentView.addChildView(view);
	view.webContents.loadURL("http://localhost:3000");
	view.setBounds({ x: 0, y: 0, width: width, height });

	const toggleEditMode = () => {
		view.webContents.executeJavaScript(`
            if (window.persistentHandlers && window.persistentHandlers.length > 0) {
               window.persistentHandlers.forEach(item => {
                   item.element.removeEventListener("mouseover", item.handlers.mouseover);
                   item.element.removeEventListener("mouseout", item.handlers.mouseout);
                   item.element.removeEventListener("click", item.handlers.click);
               });

               if (window.element){
                 window.element.style.backgroundColor = window.originalBackgroundColor;
               }

               // Clear the handlers array after removing event listeners
               window.persistentHandlers = [];
           } else {
               window.persistentHandlers = [];
               window.element = null;
               try {
                   const content = document.querySelector("body");
                   content.querySelectorAll("*").forEach((element) => {
                       let elementHandlers = {
                           mouseover: function(e) {
                               e.stopPropagation();
                               e.preventDefault();
                               window.element = this;
                               window.originalBackgroundColor = this.style.backgroundColor;
                               this.style.backgroundColor = "rgba(255, 0, 0)";
                           },
                           mouseout: function(e) {
                               e.stopPropagation();
                               e.preventDefault();
                               this.style.backgroundColor = window.originalBackgroundColor;
                               window.element = null;
                           },
                           click: function(e) {
								e.stopPropagation();
								e.preventDefault();

								// Get the clicked element
								window.element = this;
								
								let targetElement = e.target;

								// Traverse up to find an element with a 'data-component' attribute
								while (targetElement && !targetElement.hasAttribute('data-component')) {
									targetElement = targetElement.parentElement;
								}

								if (targetElement && targetElement.hasAttribute('data-component')) {
                                   const dataComponentValue = targetElement.getAttribute('data-component');
								   alert(dataComponentValue);
                                   window.electron.sendEvent("click-event", { component: dataComponentValue });
                               }
							}
                       };

                       element.addEventListener("mouseover", elementHandlers.mouseover);
                       element.addEventListener("mouseout", elementHandlers.mouseout);
                       element.addEventListener("click", elementHandlers.click);

                       window.persistentHandlers.push({
                           element: element,
                           handlers: elementHandlers
                       });
                   });
               } catch (e) {
                   console.error(e);
               }
           }
        `);
	};

	view.webContents.on("did-finish-load", () => {
		// add an on hover to all the elements
		toggleEditMode();
	});

	const floatingView = new WebContentsView({
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false,
		},
	});
	floatingView.webContents.setIgn;
	win.contentView.addChildView(floatingView);
	floatingView.setBounds({
		x: 0,
		y: 0,
		width: width,
		height: height,
	});
	floatingView.webContents.loadFile(path.join(__dirname, "index.html"));
	floatingView.setBackgroundColor("#00000000");

	floatingView.webContents.on("did-finish-load", () => {
		floatingView.webContents.openDevTools();

		// send event to renderer

		floatingView.webContents.executeJavaScript(`
            document.addEventListener('mousemove', function(event) {
                const target = event.target;
                const style = window.getComputedStyle(target);
                const isTransparent = style.opacity === '0' || style.backgroundColor === 'rgba(0, 0, 0, 0)';
        
                if (isTransparent) {
                    const {clientX, clientY} = event;
                    window.electron.sendEvent('forward-event', {type: 'mousemove', x: clientX, y: clientY});
                } else {
                    return;
                }
            });
        
            document.addEventListener('click', function(event) {
                console.log("CLICKED");
                const target = event.target;
                const style = window.getComputedStyle(target);
                const isTransparent = style.opacity === '0' || style.backgroundColor === 'rgba(0, 0, 0, 0)';
        
                if (isTransparent) {
                    window.electron.sendEvent('forward-event', {type: 'click', x: event.clientX, y: event.clientY});
                } else {
                 return;
                }
            });
        `);
	});

	view.webContents.debugger.attach("1.3");

	ipcMain.on("change-size", (event, data) => {
		console.log("Changing size:", data);
		const { device } = data;

		let viewWidth, viewHeight;

		switch (device) {
			case "mobile":
				viewWidth = 360;
				viewHeight = 640;
				break;
			case "tablet":
				viewWidth = 768;
				viewHeight = 1024;
				break;
			case "pc":
				viewWidth = width;
				viewHeight = height;
				break;
			default:
				console.error("Unknown device type.");
				return;
		}

		// Calculate the x and y coordinates to center the view
		const x = Math.round((width - viewWidth) / 2);
		const y = Math.round((height - viewHeight) / 2);

		translatedX = x;
		translatedY = y;

		view.setBounds({ x: 0, y: 0, width: viewWidth, height: viewHeight });
	});

	// In the main process or appropriate preload script
	ipcMain.on("forward-event", (event, data) => {
		// make the view focus

		if (data.type === "mousemove") {
			view.webContents.sendInputEvent({
				type: "mouseMove",
				x: data.x,
				y: data.y,
			});
		} else if (data.type === "click") {

			view.webContents.focus();

			view.webContents.debugger.sendCommand("Input.dispatchMouseEvent", {
				type: "mousePressed",
				x: data.x,
				y: data.y,
				button: "left",
				clickCount: 1,
			});

			setTimeout(() => {
				view.webContents.debugger.sendCommand("Input.dispatchMouseEvent", {
					type: "mouseReleased",
					x: data.x,
					y: data.y,
					button: "left",
					clickCount: 1,
				});
			}, 100);
		}
	});

	let globalComponentKeyword = "initialize"

	ipcMain.on("click-event", (event, data) => {
		if (!projectDir) {
			console.error("Project directory not set");
			event.reply("component-selected", { error: "Project directory not set" });
			return;
		}

		// Use fs to locate the file
		globalComponentKeyword = data.component;
		const filePath = path.join(projectDir, data.component);

		// Check if the file exists
		// displayComponent(filePath);
	});

	ipcMain.on("save-edit", (event, data) => {
		const { path, content } = data;
		fs.writeFile(path, content, (err) => {
			if (err) {
				console.error("Error writing file:", err);
			} else {
				console.log("File saved successfully:", path);
			}
		});
	});

	const makeEdits = (requested_change, filepath, csspath, component_keyword) => {
		console.log("is componen t klyeword CHILLL", component_keyword);
		fs.readFile(filepath, "utf8", (err, componentContent) => {
			if (err) {
				console.error(`Error reading file ${filepath}:`, err);
				return;
			}

			fs.readFile(csspath, "utf8", (err, stylesheetContent) => {
				if (err) {
					console.error(`Error reading file ${csspath}:`, err);
					return;
				}
				
				// Updated postData structure according to the new format
				const postData = {
					//input_value: requested_change, // Input value for the request
					output_type: "text",           // Required output type
					//input_type: "text",            // Required input type
					tweaks: {
						//"Prompt-Y2aTm": {},        // New keys as per new format
						"TextInput-gLiSp": { input_value: requested_change },
						"TextInput-34WLE": { input_value: componentContent },  // stylesheetContent
						"TextInput-Xwk6R": { input_value: stylesheetContent }, 
						"OpenAIModel-kXvtZ": {},
						"TextInput-WbI5U": { input_value: component_keyword }
					},
				};
				
				axios
					.post(
						"http://127.0.0.1:7860/api/v1/run/coder?stream=false", // Updated endpoint
						postData,
						{ headers: {'Content-Type': 'application/json' }}
					)
					.then((response) => {
						const text = response.data.outputs[0].outputs[0].results.text.data.text;
						console.log("text", text); // PICK UP HERE
						console.log("full API Response (EDIT):", JSON.stringify(response.data, null, 2)); // Log the response for debugging
						
						// Function to extract sections based on delimiters
						function extractSection(fullText, sectionStartDelimiter) {
							const startIndex =
								fullText.indexOf(sectionStartDelimiter) +
								sectionStartDelimiter.length;
							const endIndex = fullText.indexOf("```", startIndex);
							return fullText.substring(startIndex, endIndex).trim();
						}
	
						// Extract UPDATED REACT COMPONENT
						const updatedReactComponent = extractSection(text, "```tsx");
						console.log("UPDATED REACT COMPONENT:", updatedReactComponent);
	
						// Extract UPDATED STYLESHEET
						const updatedStylesheet = extractSection(text, "```css");
						console.log("UPDATED STYLESHEET:", updatedStylesheet);
	
						// Write the updated content to the files
						fs.writeFile(filepath, updatedReactComponent, (err) => {
							if (err) {
								console.error("Error writing file:", err);
							} else {
								console.log("File saved successfully:", filepath);
							}
						});
	
						fs.writeFile(csspath, updatedStylesheet, (err) => {
							if (err) {
								console.error("Error writing file:", err);
							} else {
								console.log("File saved successfully:", csspath);
							}
						});
					})
					.catch((error) => {
						console.error("Error making POST request:", error);
					});
			});
		});
	};
	

	ipcMain.on("input-event", (event, data) => {
		console.log("Input event received:", data);
		let requested_change = data.input;
		const filepath = data.path;
		const csspath = data.path.replace(".tsx", ".css");
	
		console.log("Filepath:", filepath);
		console.log("CSS Filepath:", csspath);
		if (data.operation === "edit") {
			// Read contents from path
			// console.log("Requested Change:", requested_change); Requested change works
			makeEdits(requested_change, filepath, csspath, globalComponentKeyword);
		} else if (data.operation === "new") {     
			const postData = {
				input_value: requested_change, // Replace "message" with your actual input value if necessary
				output_type: "text",    // Required output type
				input_type: "text",     // Required input type
				tweaks: {
					"Prompt-CvKnl": {},
					"TextInput-2VbVx": {},
					"TextOutput-SDzoG": {},
					"Prompt-ID87b": {},
					"OpenAIModel-sMxtT": {},
  					"OpenAIModel-ZKR6O": {}
				},
			};
		
			axios
				.post("http://127.0.0.1:7860/api/v1/run/coder-1?stream=false", postData, { headers: { 'Content-Type': 'application/json' } }) // Set content type header
				.then((response) => {
					const text =
						response.data.outputs[0].outputs[0].results.text.data.text;
					
						console.log("full API Response (MAKE_NEW):", JSON.stringify(response.data, null, 2)); 

					// Function to extract sections based on delimiters
					function extractSection(fullText, sectionStartDelimiter) {
						const startIndex =
							fullText.indexOf(sectionStartDelimiter) +
							sectionStartDelimiter.length;
						const endIndex = fullText.indexOf("```", startIndex);
						return fullText.substring(startIndex, endIndex).trim();
					}
					  
	
					let filename = extractSection(text, "```plaintext"); 
					console.log("Filename LINE 389:", filename);
	
					// Extract UPDATED REACT COMPONENT
					const newReactComponent = extractSection(text, "```tsx");
					console.log("NEW REACT COMPONENT:", newReactComponent);
	
					// Extract UPDATED STYLESHEET
					const newStyleSheet = extractSection(text, "```css");
					console.log("NEW STYLESHEET:", newStyleSheet);
					
					Testing_projectDir = "C:\\Users\\edmun\\Desktop\\VSCode Projects\\Code-Magician\\templates\\my-app\\src"
					const directory = Testing_projectDir; // POSSIBLE_ERROR (was projectDir)
	
					// Ensure the directory exists
					if (!fs.existsSync(directory)) {
						fs.mkdirSync(directory, { recursive: true });
					}
	
					// Create and write the .tsx file
					const tsxFilePath = path.join(directory, `${filename}.tsx`);
					fs.writeFileSync(tsxFilePath, newReactComponent, "utf8");
					console.log(`File written: ${tsxFilePath}`);
	
					// Create and write the .css file
					const cssFilePath = path.join(directory, `${filename}.css`);
					fs.writeFileSync(cssFilePath, newStyleSheet, "utf8");
					console.log(`File written: ${cssFilePath}`);
	
					requested_change =
						`The new component ${filename} has been created at ${tsxFilePath}.
					Simply add the new component to this React component in the appropriate location while keeping the requested change in mind:` +
						requested_change;
					makeEdits(requested_change, filepath, csspath, globalComponentKeyword); 
				})
				.catch((error) => {
					console.error("Error making POST request:", error);
				});
		}
	});
	

	const displayComponent = (filePath) => {
		fs.stat(filePath, (err, stats) => {
			if (err) {
				// Handle errors (e.g., file does not exist)
				console.error("File does not exist:", err);

				floatingView.webContents.send("component-selected", {
					exists: false,
					path: filePath,
					error: err.message,
				});
			} else {
				console.log("File exists:", filePath);
				// File exists, now read the file content
				fs.readFile(filePath, "utf8", (err, data) => {
					if (err) {
						console.error("Error reading file:", err);
						floatingView.webContents.send("component-selected", {
							exists: true,
							path: filePath,
							error: err.message,
						});
					} else {
						console.log("Filepath:", filePath);

						// Send back that the file exists, its path, and its content
						floatingView.webContents.send("component-selected", {
							exists: true,
							path: filePath,
							content: data,
						});
					}
				});
			}
		});
	};

	ipcMain.on("select-component", (event, data) => {
		if (!projectDir) {
			console.error("Project directory not set");
			event.reply("component-selected", { error: "Project directory not set" });
			return;
		}
		console.log("Selecting component:", data);
		// Use fs to locate the file
		const filePath = data.path;

		// displayComponent(filePath);
	});

	ipcMain.on("toggle-edit-mode", (event, data) => {
		toggleEditMode();
	});

	// Listen for
	

	ipcMain.on("set-project-dir", (event, path) => {
		projectDir = path; // Set the project directory
		getComponents();
	});

	ipcMain.on("publish", (event, data) => {
		const tsxFilePath = data.path;
		const cssFilePath = tsxFilePath.replace(".tsx", ".css");
	
		// Read contents from path
		fs.readFile(tsxFilePath, "utf8", (err, componentContent) => {
			if (err) {
				console.error(`Error reading file ${tsxFilePath}:`, err);
				return;
			}
	
			fs.readFile(cssFilePath, "utf8", (err, stylesheetContent) => {
				if (err) {
					console.error(`Error reading file ${cssFilePath}:`, err);
					return;
				}
	
				// Update postData structure
				const postData = {
					input_value: requested_change, // Replace "message" with your actual input value if necessary POSSIBLE_ERROR // changed from hard code
					output_type: "text",    // Required output type
					input_type: "text",     // Required input type
					tweaks: {
						"Prompt-KIm84": {},
						"AstraVectorStoreComponent-CsAeK": {},
						"TextInput-nPq0d": {},
						"TextInput-D2RBL": {},
						"DocumentBuilder-TdRli": {},
						"TextInput-PjEeV": {},
						"OllamaModel-JwfPJ": {},
						"OllamaEmbeddings-AqjGH": {},
						// Additional fields can be added if necessary
					},
				};
	
				console.log("Post data:", postData);
	
				axios
					.post(
						"http://127.0.0.1:7860/api/v1/run/37cbc54f-99ad-4619-9b99-af451b20072e?stream=false",
						postData,
						{ headers: { 'Content-Type': 'application/json' } } // Set content type header
					)
					.then((response) => {
						console.log("Response:", response.data);
						getComponents();
					})
					.catch((error) => {
						console.error("Error making POST request:", error);
					});
			});
		});
	});
	

	function getComponents ()  {
		console.log("getComponents was called");
		fetch(
			"http://127.0.0.1:7860/api/v1/run/b2fbc41e-2152-4d8b-a355-308947137b8f?stream=false",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					output_type: "text",
					input_type: "text",
					tweaks: {
						"AstraVectorStoreComponent-oJMfx": {},
						"TextInput-dCgP1": {input_value: "all"},
						"TextOutput-0anA0": {},
						"StringifyData-RUBvF": {},
						"OpenAIEmbeddings-dQbZg": {}
					}
				}),
			}
		)
		.then((response) => response.json())
		.then((data) => {
			let namesList = JSON.parse(
				data.outputs[0].outputs[0].results.text.data.text
			)
			console.log("full API Response (CP Retrieval):", JSON.stringify(data, null, 2));// Log the response for debugging
			// filter out any that dont have .path
			namesList = namesList.filter((item) => item.path);

			// filter out duplicate names
			const uniqueNames = new Set();
			namesList = namesList.filter((item) => {
				if (!uniqueNames.has(item.path)) {
					uniqueNames.add(item.path);
					return true;
				}
				return false;
			});

			namesList.forEach((item) => {
				item.name = item.path.split("\\").pop();
			});

			// send to floating window
			console.log(namesList);
			floatingView.webContents.send("components", namesList);
		})
		.catch((error) => console.error("Error:", error));
	};


};

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(() => {
	createWindow();
	ipcMain.handle("read-file", async (event, filePath) => {
		try {
			const content = await fs.promises.readFile(filePath, {
				encoding: "utf-8",
			});
			return content;
		} catch (error) {
			return error.message;
		}
	});

	ipcMain.handle("write-file", async (event, filePath, content) => {
		try {
			await fs.promises.writeFile(filePath, content, { encoding: "utf-8" });
			return null;
		} catch (error) {
			return error.message;
		}
	});

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

