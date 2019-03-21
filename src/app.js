const { PythonShell } = require("python-shell")
const express = require("express")
const fs = require("fs")
const multer = require("multer")
const { spawn, exec } = require("child_process")

const app = express()
app.use(express.static("./public"))

var filename

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        filename = file.fieldname + '-' + Date.now() + ".jpg"
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
    const filePath = req.file.path
    console.log(req);
    
    console.log(`-f ./${filePath} -j ./JSONimages`);
    console.log(req.params.color);
    
    const args = ["-f", "./" + filePath, "-j", "./JSONimages", (req.params.color === "true") ? ("-c") : ("")]

    PythonShell.run("./python/ascii_image.py", {
        mode: "text",
        args: ["-f", "./" + filePath, "-j", "./JSONimages"]
    }, (e, results) => {
        if(e) {
            console.log("Error: \n", e.traceback);
        }

        const JSONImagePath = results[0];

        console.log(JSONImagePath);

        fs.readFile(JSONImagePath, (e, result) => {
            if(e) {
                console.log(e);
                
                return res.status(500).send()
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

// app.get("/ascii:image", (req, res) => {


    // PythonShell.run("./python/test.py", null, (e, results) => {
    //     console.log(results);
    
    // })

    // res.send()
// })



// fs.readFile("./ascii_image.json", (e, result) => {
//     if(e) {
//         throw new Error("")
//     }
    
//     app.get("/ascii:image", (req, res) => {
//         res.send(result)
//     })

//     // console.log(parsedImage.image);
// })

app.listen("3000", () => {
    console.log("Server up on port 3000");
    
})