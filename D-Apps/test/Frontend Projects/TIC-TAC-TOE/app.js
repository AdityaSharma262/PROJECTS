let boxes = document.querySelectorAll(".box");
let button = document.querySelector(".reset");

let msgcontainer = document.querySelector(".msg-container");
let msgg = document.querySelector("#msg");
let newGameBtn = document.querySelector("#nw-btn");

let turnO = true;
let count = 0;

const winPattern = [

    [0,1,2],
    [0,3,6],
    [0,4,8],
    [1,4,7],
    [2,5,8],
    [2,4,6],
    [3,4,5],
    [6,7,8],
];

const resetGame = () => {
    turnO = true;
    enableBoxes();
    msgcontainer.classList.add("hide");
}





boxes.forEach((box) => {
    box.addEventListener("click", () => {
    console.log("block was clicked ");
    if (turnO) {
        box.innerText ="O"
        turnO = false;   
    }else{
        box.innerText = "X"
        turnO = true;
    }
    box.disabled = true;

    count++;

    let isWinner = checkWinner();

    if (count === 9 && !isWinner) {
      gameDraw();
    }

    

     checkWinner();
    })
    
});

const gameDraw = () => {
    msg.innerText = `Game was a Draw.`;
    msgContainer.classList.remove("hide");
    disableBoxes();
};

const disableBoxes = () => {
    for(let box of boxes){
        box.disabled  = true;
    }
}

const enableBoxes = () => {
    for(let box of boxes){
        box.disabled  = false;
        box.innerText = "";
    }
}


const showWinner =(winner) => {
msgg.innerText = `Congratulations, Winner is ${winner}`;
msgcontainer.classList.remove ("hide");
 disableBoxes()
}

const  checkWinner= () => {
    for (let pattern of winPattern) {
        
        // console.log(pattern[0],pattern[1],pattern[2] );
        // console.log(boxes[pattern[0]].innerText,
        //             boxes[pattern[1]].innerText,
        //             boxes[pattern[2]].innerText );


                let pos1 =boxes[pattern[0]].innerText;
                let pos2 =boxes[pattern[1]].innerText;
                let pos3 =boxes[pattern[2]].innerText;
                
            if (pos1 !="" && pos2 !="" && pos3 !="") {
                if (pos1===pos2 && pos2===pos3) {
                    console.log("winner",pos1);
                    
                    showWinner(pos1);
                }
                
            }    




    }


}


newGameBtn.addEventListener("click",resetGame);
button.addEventListener("click",resetGame);
