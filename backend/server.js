const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 5000;
const upload = multer({ dest: './public/data/uploads/' });

app.use(cors()); 
app.use(express.json());

app.post('/compute', upload.fields([
    { name: 'uploaded_file_one', maxCount: 1 },
    { name: 'uploaded_file_two', maxCount: 1 }
]), (req, res) => {
   console.log(req.files, req.body); 
   res.send("Files received");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
