NOTE: The following installation guide is written for macOS; please refer to the online documentation for equivalent commands if you are using Windows or Linux. Commands meant for command lines are written in italics between apostrophes, i.e., ‘command line commands’

Please ensure that you have the following prerequisites installed:
Node.js (v14+). Installation instructions: https://nodejs.org/en/download 
Python (3.6+). Installation instructions: https://www.python.org/downloads/
Pip (if needed). Installation instructions: https://pip.pypa.io/en/stable/installation/

To install the project source code is hosted on GitHub which can be downloaded to the local machine through the following steps.

Fork the GitHub repo at the link to your GitHub: https://github.com/tnguy19/lung-detect-web 
Clone the repository on your local machine:
‘git clone https://github.com/{YOUR GITHUB USERNAME }/lung-detect.git
cd lung-detect’ 
At the root level of the project folder, install Node.js dependencies: 
‘ npm install’
Install Python dependencies: 
‘pip install librosa numpy scipy soundfile matplotlib’
Create uploads directory if it doesn't exist:
‘mkdir -p public/data/uploads’
 Install dependencies: 
‘npm install’
Navigate to the ‘backend’ directory in the project folder to download the Python dependencies:
‘pip install librosa numpy scipy soundfile matplotlib’

After the installation is complete, you can start the application with the following:
Build the (frontend) application: 
‘npm run build’
Build the (frontend) application:
‘npm install -g serve
serve -s build -l 3000’
Open a new terminal and navigate to the ‘backend’ directory in the project folder. Start the backend Node server:
‘node server’

To end the hosting of both frontend and backend, simply navigate to the terminal that you used to host either and press ‘Control+C’ on your keyboard to terminate the server. 

2.4.3 Accessing the application:

After the application is correctly installed and set up, you can access it by going to your preferred web browser and typing either the following address in the search bar:
Locally: `http://localhost:3000`
From all devices on the network: `http://{YOUR_IP_ADDRESS}:3000`

To find your machine’s local IP address, please type the following command on your command line:
On macOS/Linux: `ifconfig` or `ip addr`
On Windows: `ipconfig`

Another option would be to look at the output displayed on the terminal when starting your frontend or backend server. Input that value in the {YOUR_IP_ADDRESS} section of the link above. This will also be the link that can be used by every machine on your local network to access the application, provided that there is one machine hosting the application. Please also make sure your firewall allows incoming connections on ports 3000 (frontend) and 5000 (backend).
