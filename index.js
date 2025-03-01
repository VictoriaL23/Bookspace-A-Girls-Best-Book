import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

//use the body parser middleware
//This is to access my static files 
app.use(express.static("public"));  
app.use(bodyParser.urlencoded({ extended: true }));

//Render home page
app.get("/", (req,res) => {
    res.render("index.ejs");
})

//Process user data using body parser
app.post("/book", async (req, res) =>{
    //get data from the users submitted form
    const genre = req.body.genre;
    console.log(genre);
    
   //Using axios to interact with OPEN LIBRARY API
    try{
    const result = await axios.get(`https://openlibrary.org/subjects/${genre}.json`, {
 
        params: {
            
            limit: 1000,
            details: true
        }
    });
    //Call function to select random book and set return to random book data
    const selectedBook = await generateRandomBook(result.data);
    console.log(selectedBook);
     
    res.render("book.ejs", { book: selectedBook });
    
    }catch (error) {
        console.error("Error fetching data:", error.message);
    
        res.status(error.response?.status || 500).json({
            message: "Failed to fetch data",
            error: error.message
        });
    }
})

//Function to select random book passing through the selected book list  
async function generateRandomBook(data){
    //List of variables for function
    let coverUrl = '';
    let description = "";
    let pageNumber = 0;
    let isbn = '';
    
    const bookList = data.works || data.docs;
    console.log(`The length of the book list is ` + bookList.length);
    
    //create random number to chose random object in array of objects 
    const randNum = Math.floor((Math.random() * bookList.length) + 1);
    //select random object using the randomNum and bookList array
    const randBook = bookList[randNum];
    let workId = randBook.key;
 
    //Begin Building the Cover URL
    //If statement to get the url for the cover using one of two options.
    if(randBook.cover_id){
         coverUrl = `https://covers.openlibrary.org/b/id/${randBook.cover_id}-L.jpg`;
         //console.log(coverUrl);

    } else if (randBook.cover_edition_key) {
        coverUrl = `https://covers.openlibrary.org/b/olid/${randBook.cover_edition_key}-L.jpg`; 
    } else {
        coverUrl = '/images/null.png';
    }

    //Axios to fetch more book information
    try{
    const response = await axios.get(`https://openlibrary.org${workId}/editions.json`);
    
    //Isolate the object in the array 
    const entry = response.data.entries?.[0] || {};
    //Isolate the number of pages
    pageNumber = entry?.number_of_pages ?? "No data available";
    //if statement to check if there is an ISBN 
    if(entry.isbn_10){
        isbn = entry.isbn_10[0];
    } else if(entry.isbn_13){
        isbn = entry.isbn_13[0];
    } else{
        isbn = "No data to show";
    }
    
    } catch (error) {
        // console.error("Error fetching data:", error.message);
    
        // res.status(error.response?.status || 500).json({
        //     message: "Failed to fetch data",
        //     error: error.message
        // });
    }

    //axios request to fetch the description 
    try{
    const editionResult = await axios.get(`https://openlibrary.org${workId}.json?format=json&jscmd=data`);

    description = editionResult.data.description?.value || editionResult.data.description || "No data to show";

    }  catch (error) {
        console.error("Error fetching data:", error.message);
    
        res.status(error.response?.status || 500).json({
            message: "Failed to fetch data",
            error: error.message
        });
    }
        return {
            pageNum: pageNumber,
            title: randBook.title,
            author: randBook.authors?.[0]?.name || "Unknown Author",
            cover: coverUrl,
            bookIsbn: isbn,
            summary: description
        };
}

//Listening for port / starting server 
app.listen(port, () => {
    console.log(`now listening on port ${port}`);
})