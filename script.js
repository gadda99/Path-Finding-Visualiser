var totalRows = 40;
var totalCols = 40;
var inProgress = false;
var cellsToAnimate = [];
var createWalls = false;
var algorithm = null;
var justFinished = false;
var animationSpeed = "Fast";
var animationState = null;
var startCell = [15, 20]; //the green cell
var endCell = [20, 20];	//the red cell
var movingStart = false;
var movingEnd = false;



/*
------------------------------------------------
Functions and methods to create grid of size n*n.
------------------------------------------------
*/

function generateGrid(rows,cols) {
	var grid = "<table>";

	for (row=1;row<=rows;row++) {
		grid+="<tr>";
		for(col=1;col<=cols;col++) {
			grid+="<td></td>";
		}
		grid+="</tr>";
	}
	grid+="</table>";

	return grid;
}

var merigrid = generateGrid(totalRows,totalCols);

$( "#tableContainer" ).append(merigrid);


/*
--------------------------------------
Object and Data Structures to be used
--------------------------------------
*/

function Queue() { 
 this.stack = new Array();
 this.dequeue = function(){
  	return this.stack.pop(); 
 } 
 this.enqueue = function(item){
  	this.stack.unshift(item);
  	return;
 }
 this.empty = function(){
 	return ( this.stack.length == 0 );
 }
 this.clear = function(){
 	this.stack = new Array();
 	return;
 }
}

function minHeap() {
	this.heap = [];
	this.isEmpty = function(){
		return (this.heap.length == 0);
	}
	this.clear = function(){
		this.heap = [];
		return;
	}
	this.getMin = function(){
		if (this.isEmpty()){
			return null;
		}
		var min = this.heap[0];
		this.heap[0] = this.heap[this.heap.length - 1];
		this.heap[this.heap.length - 1] = min;
		this.heap.pop();
		if (!this.isEmpty()){
			this.siftDown(0);
		}
		return min;
	}
	this.push = function(item){
		this.heap.push(item);
		this.siftUp(this.heap.length - 1);
		return;
	}
	this.parent = function(index){
		if (index == 0){
			return null;
		}
		return Math.floor((index - 1) / 2);
	}
	this.children = function(index){
		return [(index * 2) + 1, (index * 2) + 2];
	}
	this.siftDown = function(index){
		var children = this.children(index);
		var leftChildValid = (children[0] <= (this.heap.length - 1));
		var rightChildValid = (children[1] <= (this.heap.length - 1));
		var newIndex = index;
		if (leftChildValid && this.heap[newIndex][0] > this.heap[children[0]][0]){
			newIndex = children[0];
		}
		if (rightChildValid && this.heap[newIndex][0] > this.heap[children[1]][0]){
			newIndex = children[1];
		}
		// No sifting down needed
		if (newIndex === index){ return; }
		var val = this.heap[index];
		this.heap[index] = this.heap[newIndex];
		this.heap[newIndex] = val;
		this.siftDown(newIndex);
		return;
	}
	this.siftUp = function(index){
		var parent = this.parent(index);
		if (parent !== null && this.heap[index][0] < this.heap[parent][0]){
			var val = this.heap[index];
			this.heap[index] = this.heap[parent];
			this.heap[parent] = val;
			this.siftUp(parent);
		}
		return;
	}
}

/*
----------------
Mouse Functions
----------------
*/


/*moving the positioned cursors in the grid */

$("td").mousedown(function(){
	var index = $("td").index(this);
	var startCellIndex = (startCell[0]*(totalCols)) + startCell[1];
	var endCellIndex = (endCell[0]*(totalCols)) + endCell[1];

	if(!inProgress) {
			//this means that the process of pathfinding has finished
		if ( justFinished  && !inProgress ){ 
			clearBoard( keepWalls = true ); 
			justFinished = false;
		}
		if (index == startCellIndex){  //if the chosen cell to be moved is the start index
			movingStart = true;
			
		} else if (index == endCellIndex){ //if the chosen cell to be moved is the end index
			movingEnd = true;
		
		} else { 		//else the creation of wall needs to take place at that place
			createWalls = true;
		}
	}
});

/*function to drop cells around */
$("td").mouseup(function(){
	createWalls = false;
	movingStart = false;
	movingEnd = false;
});


//function to help create a wall at any clicked cell of the grid
//and also help in the movement of the start or end index 
$("td").mouseenter(function(){
	if(!createWalls && !movingStart && !movingEnd) {return; }
	var index = $("td").index(this);
	var startCellIndex = (startCell[0]*(totalCols)) + startCell[1];
	var endCellIndex = (endCell[0]*(totalCols)) + endCell[1];
	if(!inProgress) { //if the process has finished 
		if(justFinished) {
			clearBoard(keepWalls = true); //we would keep the walls even though the process has finished
			justFinished = False;
		}

		if(movingStart && index != endCellIndex) {
			moveStartOrEnd(startCellIndex,index,"start");
		}
		else if (movingEnd && index != startCellIndex) {
    		moveStartOrEnd(endCellIndex, index, "end");
    	} else if (index != startCellIndex && index != endCellIndex) {
    		$(this).toggleClass("wall");
    	}
	}
});

//this will help in dragging the click on any of the empty cell and making every draged/hovered cell to be a wall
$( "td" ).click(function() {
    var index = $( "td" ).index( this );
    var startCellIndex = (startCell[0] * (totalCols)) + startCell[1];
	var endCellIndex = (endCell[0] * (totalCols)) + endCell[1];
    if ((inProgress == false) && !(index == startCellIndex) && !(index == endCellIndex)){  //if the clicked/hovered cell is not a start/end index
    	if ( justFinished ){ 
    		clearBoard( keepWalls = true );
    		justFinished = false;
    	}
    	$(this).toggleClass("wall"); // else if the process is not started/finished it will make it a wall
    }
});




/*
-----------
Buttons
-----------
*/

//activating the start button

$("#startBtn").click(function() {
	if(algorithm == null) { 	//if no algorithm has been selected, then it will not work
		return ;
	}
	if(inProgress) {	// if the algorithm is running 
	 update("wait");
	 return; 
	}
	traverseGraph(algorithm);
	
});

//activating the end button

$("#clearBtn").click(function() {
	if(inProgress) {update("wait"); return;} // if the user presses the button while the algorithm is still going on, then display the error message!
	clearBoard(keepWalls=false); //else, we will call the clear board function, with specification like dont keep the walls, remove them also 
});


/*
-----------------------
Activating NavBar menus
-----------------------
*/

//Updating the Algorithm Chosen
$("#algorithms .dropdown-item").click(function(){
	if(inProgress) {update("wait"); return; }
	algorithm = $(this).text();
	updateStartBtnText();
	console.log("Algorithm chosen is: "+algorithm);
});


//Updating the Speed of the animation

$("#speed .dropdown-item").click(function(){
	if(inProgress) {update("wait"); return; }
	animationSpeed = $(this).text();
	updateSpeedDisplay();
	console.log("Speed has been chosen as: "+animationSpeed);
});


/*
-------------------
Functions
-------------------
*/

//This function is created for moving the Starting pointer or the ending pointer.

function moveStartOrEnd(prevIndex,newIndex,startOrEnd) {
	var newCellY = newIndex % totalCols;
	var newCellX = Math.floor((newIndex - newCellY)/totalCols);

	if (startOrEnd == "start") {
		startCell = [newCellX,newCellY];
		console.log("Moving start to ["+newCellX+","+newCellY+"]")
	} else {
		endCell  = [newCellX, newCellY];
		console.log("Moving end to ["+newCellX+","+newCellY+"]")
	}
	clearBoard(keepWalls=true);
	return;
}

//This function is used to move the end pointer
function moveEnd(prevIndex,newIndex) {
	$($("td").find(prevIndex)).removeClass();

	var newEnd = $("td").find(newIndex);
	$(newEnd).removeClass();
	$(newEnd).addClass("end");

	var newEndX = Math.floor(newIndex/totalRows);
	var newEndY = Math.floor(newIndex/totalCols);
	startCell = [newStartX,newStartY];
	return;
}



//Updating the start button after choosing the algorithm
function updateStartBtnText() {
    if(algorithm == "Breadth First Search") {
		$("#startBtn").html("Start BFS");
	}

	else if(algorithm == "Dijkstra's Algorithm") {
		$("#startBtn").html("Start Dijkstra");
	}
	return;
}

//For displaying error messages
function update(message) {
	// $("#resultsIcon").removeClass();
	// $("#resultsIcon").addClass("fas fa-exclamation");
	// $("#results").css("background-color","#ffffff");
	$("#duration").text("!");
	if(message == "wait") {
		$("#length").text("Please wait for the Algorithm to finish!");
	}
}


// For displaying results
function updateResults(duration,pathFound,length) {
	// var firstAnimation = "swashOut";
	// var secondAnimation = "swashIn";
	// $("#results").removeClass();
	// $("#results").addClass("magictime "+firstAnimation);
	setTimeout(function(){
		// $("#resultsIcon").removeClass();
		if(pathFound){
			$("#results").css("background-color","green");
			// $("resultsIcon").addClass("fas fa-check");
		}
		else {
			$("#results").css("background-color","#ff6961");
			//$("#resultsIcon").addClass("fas fa-times");
		}
		$("#duration").text("Duration: "+duration+"ms");
		$("#length").text("Length: "+length+" units");
		// $("#results").removeClass(firstAnimation);
		// $("#results").addClass(secondAnimation);

	},1100);
}



//counting length of the successful path 

function countLength() {
	var cells = $("td");
	var l=0;
	for(var i=0;i<cells.length;i++) {
		if($(cells[i]).hasClass("success")) {
			l++;
		}
	}
	return l;
}

//Preparing the Grid for grpah traversal

async function traverseGraph(algorithm) {
	inProgress = true;
	clearBoard (keepWalls = true);
	var startTime  = Date.now();
	var pathFound = executeAlgo();
	var endTime = Date.now();
	await animateCells();
	if(pathFound) {
		updateResults((endTime - startTime),true,countLength());
	}
	else {
		updateResults((endTime - startTime),false,countLength());
	}
	inProgress = false;
	justFinished = true;
}

//Finding the desired path for the chosen Algorithm

function executeAlgo() {
	if(algorithm == "Depth First Search") {
		var visited = createVisited();
		var pathFound = DFS(startCell[0],startCell[1],visited);
	} else if (algorithm == "Breadth First Search") {
		var pathFound = BFS();
	} else if  (algorithm == "Dijkstra's Algorithm") {
		var pathFound = dijkstra();
	}
	return pathFound;
}


//Function to retain the walls while traversing the algorithm

function makewall(cell) {
	if(!createWalls) {return;}
	var index = $("td").index(cell);
	var row = Math.floor((index)/totalRows)+1;
	var col = (index%totalCols)+1;
	console.log([row,col]);
	if((inProgress == false)&&!(row==1&&col==1)&&!(row==totalRows && col == totalCols)) {
		$(cell).toggleClass("wall");
	}
} 



//Function to make or consider a cell to be visited

function createVisited() {
	var visited = [];
	var cells = $("#tableContainer").find("td");
	for(var i=0;i<totalRows;i++) {
		var row = [];
		for( var j=0;j<totalCols;j++) {
			if(cellIsAWall(i,j,cells)) {
				row.push(true);
			}
			else {
				row.push(false);
			}
		}
		visited.push(row);
	}
	return visited;
}

//Function to check if a cell has a wall or not.

function cellIsAWall(i,j,cells) {
	var cellNum = (i*(totalCols))+j;
	return $(cells[cellNum]).hasClass("wall");
}



//Function for BFS traversal

function BFS() {
	var pathFound = false;
	var myQueue = new Queue();
	var prev = createPrev();
	var visited = createVisited();
	myQueue.enqueue(startCell);
	cellsToAnimate.push(startCell,"searching");
	visited[startCell[0]][startCell[1]] = true;
	while(!myQueue.empty()) {
		var cell = myQueue.dequeue();
		var r = cell[0];
		var c = cell[1];
		cellsToAnimate.push([cell,"visited"]);
		if(r==endCell[0]&&c==endCell[1]) {
			pathFound = true;
			break;
		}
		//adding the neighbouring cells in queue
		var neighbors  = getNeighbors(r,c);
		for(var k=0;k<neighbors.length;k++) {
			var m=neighbors[k][0];
			var n=neighbors[k][1];
			if(visited[m][n]) {continue;}
			visited[m][n] = true;
			prev[m][n] = [r,c];
			cellsToAnimate.push([neighbors[k],"searching"]);
			myQueue.enqueue(neighbors[k]);
		}
	}

	//making nodes in the queue to be "visited"
	while(!myQueue.empty()) {
		var cell = myQueue.dequeue();
		var r=cell[0];
		var c=cell[1];
		cellsToAnimate.push([cell,"visited"]);
	}

	//highlighting the found path
	if(pathFound) {
		var r = endCell[0];
		var c = endCell[1];
		cellsToAnimate.push([[r,c],"success"]);
		while(prev[r][c]!=null) {
			var prevCell = prev[r][c];
			r = prevCell[0];
			c = prevCell[1];
			cellsToAnimate.push([[r,c],"success"]);
		}
	}

	return pathFound;
}



//function for Dijkstra's Algorithm

function dijkstra() {
	var pathFound = false;
	var myHeap = new minHeap();
	var prev = createPrev();
	var distances = createDistances();
	var visited = createVisited();
	distances[ startCell[0] ][ startCell[1] ] = 0;
	myHeap.push([0, [startCell[0], startCell[1]]]);
	cellsToAnimate.push([[startCell[0], startCell[1]], "searching"]);
	while (!myHeap.isEmpty()){
		var cell = myHeap.getMin();
		//console.log("Min was just popped from the heap! Heap is now: " + JSON.stringify(myHeap.heap));
		var i = cell[1][0];
		var j = cell[1][1];
		if (visited[i][j]){ continue; }
		visited[i][j] = true;
		cellsToAnimate.push([[i, j], "visited"]);
		if (i == endCell[0] && j == endCell[1]){
			pathFound = true;
			break;
		}
		var neighbors = getNeighbors(i, j);
		for (var k = 0; k < neighbors.length; k++){
			var m = neighbors[k][0];
			var n = neighbors[k][1];
			if (visited[m][n]){ continue; }
			var newDistance = distances[i][j] + 1;
			if (newDistance < distances[m][n]){
				distances[m][n] = newDistance;
				prev[m][n] = [i, j];
				myHeap.push([newDistance, [m, n]]);
				//console.log("New cell was added to the heap! It has distance = " + newDistance + ". Heap = " + JSON.stringify(myHeap.heap));
				cellsToAnimate.push( [[m, n], "searching"] );
			}
		}
		//console.log("Cell [" + i + ", " + j + "] was just evaluated! myHeap is now: " + JSON.stringify(myHeap.heap));
	}
	//console.log(JSON.stringify(myHeap.heap));
	// Make any nodes still in the heap "visited"
	while ( !myHeap.isEmpty() ){
		var cell = myHeap.getMin();
		var i = cell[1][0];
		var j = cell[1][1];
		if (visited[i][j]){ continue; }
		visited[i][j] = true;
		cellsToAnimate.push( [[i, j], "visited"] );
	}
	// If a path was found, illuminate it
	if (pathFound) {
		var i = endCell[0];
		var j = endCell[1];
		cellsToAnimate.push( [endCell, "success"] );
		while (prev[i][j] != null){
			var prevCell = prev[i][j];
			i = prevCell[0];
			j = prevCell[1];
			cellsToAnimate.push( [[i, j], "success"] );
		}
	}
	return pathFound;
}

function makeWalls(){
	var walls = [];
	for (var i = 0; i < totalRows; i++){
		var row = [];
		for (var j = 0; j < totalCols; j++){
			row.push(true);
		}
		walls.push(row);
	}
	return walls;
}

//checking if the neighbor of any traversing node is a Wall?
function neighborsThatAreWalls( neighbors, walls ){
	var neighboringWalls = 0;
	for (var k = 0; k < neighbors.length; k++){
		var i = neighbors[k][0];
		var j = neighbors[k][1];
		if (walls[i][j]) { neighboringWalls++; }
	}
	return neighboringWalls;
}


//Used in Dijkstra's Algorithm
function createDistances(){
	var distances = [];
	for (var i = 0; i < totalRows; i++){
		var row = [];
		for (var j = 0; j < totalCols; j++){
			row.push(Number.POSITIVE_INFINITY);
		}
		distances.push(row);
	}
	return distances;
}

function createPrev(){
	var prev = [];
	for (var i = 0; i < totalRows; i++){
		var row = [];
		for (var j = 0; j < totalCols; j++){
			row.push(null);
		}
		prev.push(row);
	}
	return prev;
}


//used for getting the neighbours of the node we are on!
function getNeighbors(i, j){
	var neighbors = [];
	if ( i > 0 ){ neighbors.push( [i - 1, j] );}
	if ( j > 0 ){ neighbors.push( [i, j - 1] );}
	if ( i < (totalRows - 1) ){ neighbors.push( [i + 1, j] );}
	if ( j < (totalCols - 1) ){ neighbors.push( [i, j + 1] );}
	return neighbors;
}


async function animateCells(){
	animationState = null;
	var cells = $("#tableContainer").find("td");
	var startCellIndex = (startCell[0] * (totalCols)) + startCell[1];
	var endCellIndex = (endCell[0] * (totalCols)) + endCell[1];
	var delay = getDelay();
	for (var i = 0; i < cellsToAnimate.length; i++){
		var cellCoordinates = cellsToAnimate[i][0];
		var x = cellCoordinates[0];
		var y = cellCoordinates[1];
		var num = (x * (totalCols)) + y;
		if (num == startCellIndex || num == endCellIndex){ continue; }
		var cell = cells[num];
		var colorClass = cellsToAnimate[i][1];

		// Wait until its time to animate
		await new Promise(resolve => setTimeout(resolve, delay));

		$(cell).removeClass();
		$(cell).addClass(colorClass);
	}
	cellsToAnimate = [];
	//console.log("End of animation has been reached!");
	return new Promise(resolve => resolve(true));
}



function getDelay(){
	var delay;
	if (animationSpeed === "Slow"){
		 {
			delay = 20;
		}
	} else if (animationSpeed === "Normal") {
		{
			delay = 10;
		}
	} else if (animationSpeed == "Fast") {
		 {
			delay = 5;
		}
	}
	console.log("Delay = " + delay);
	return delay;
}

function clearBoard( keepWalls ){
	var cells = $("#tableContainer").find("td");
	var startCellIndex = (startCell[0] * (totalCols)) + startCell[1];
	var endCellIndex = (endCell[0] * (totalCols)) + endCell[1];
	for (var i = 0; i < cells.length; i++){
			isWall = $( cells[i] ).hasClass("wall");
			$( cells[i] ).removeClass();
			if (i == startCellIndex){
				$(cells[i]).addClass("start"); 
			} else if (i == endCellIndex){
				$(cells[i]).addClass("end"); 
			} else if ( keepWalls && isWall ){ 
				$(cells[i]).addClass("wall"); 
			}
	}
}

clearBoard();

$('#myModal').on('shown.bs.modal', function () {
  $('#myInput').trigger('focus');
})

$(window).on('load',function(){
        $('#exampleModalLong').modal('show');
});
