const { PythonShell } = require("python-shell")
const express = require("express")
const fs = require("fs")
const multer = require("multer")
const path = require("path")

const port = process.env.PORT || 3000;
const app = express()

var filename // Global so that filename function can see it

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, './uploads')
    },
    filename(req, file, cb) {
        filename = file.fieldname + '-' + Date.now()
        cb(null, filename)
    }
  })
  
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb("Upload an image!", false)
        }
        
        cb(undefined, true)
    }
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/../public/index.html"))
})

app.post("/sample", (req, res) => {
    res.sendFile(path.join(__dirname + "/../public/sample.json"))
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
    if(req.body.reverse === "true") {
        args.push("-rev")
    }

    console.log(req.body.reverse);

    try {
        if(parseInt(req.body.resolution) < 201) {
            args.push("-r", req.body.resolution)
        }
    } catch(e) {
        return res.status(400).send({image: "Invalid."})
    }
    

    PythonShell.run("./python/ascii_image.py", {
        mode: "text",
        args
    }, (e, results) => {
        if(e) {
            console.log("Error: \n", e.traceback);
        }

        const JSONImagePath = results[0];

        fs.readFile(JSONImagePath, (e, result) => {
            if(e) {
                console.log(e);
                return res.status(500).send({image:"Error reading image."})
            }

            res.send(result)

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