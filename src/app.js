const { PythonShell } = require("python-shell")
const express = require("express")
const fs = require("fs")
const multer = require("multer")
const { spawn, exec } = require("child_process")

const port = process.env.PORT || 3000;

const app = express()
app.use(express.static(__dirname + '/public'));

var filename

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        filename = file.fieldname + '-' + Date.now()
        cb(null, filename)
    }
  })
  
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload an image!"))
        }
        
        cb(undefined, true)
    }
})

app.post("/ascii:image", upload.single("image"), async (req, res) => {
    var filePath
    try {
        filePath = req.file.path
    } catch(e) {
        return res.status(400).send({image: "Please upload a valid image."})
    }
    
    var args = ["-f", "./" + filePath, "-j", "./JSONimages"]
    if(req.body.color) {
        args.push("-c");
    }
    if(req.body.reverse) {
        args.push("-rev")
    }

    try {
        if(parseInt(req.body.resolution) < 201) {
            args.push("-r", req.body.resolution)
        }
    } catch(e) {
        res.status(400).send({image: "Invalid."})
    }

    console.log(args);
    

    PythonShell.run("./python/ascii_image.py", {
        mode: "text",
        args
    }, (e, results) => {
        if(e) {
            console.log("Error: \n", e.traceback);
        }

        const JSONImagePath = results[0];

        // console.log(JSONImagePath);

        fs.readFile(JSONImagePath, (e, result) => {
            if(e) {
                console.log(e);
                return res.status(500).send({image:"Error reading image."})
            }

            res.send(result)

            console.log(JSON.parse(result).pixel_values);
            

            fs.unlink(JSONImagePath, (e) => {
                if(e) {
                    console.log(e);
                }
            })

            fs.unlink(filePath, (e) => {
                if(e) {
                    console.log(e);   
                }
            })
        })
    })
})

app.listen(port, () => {
    console.log("Server up on port " + port);
    
})