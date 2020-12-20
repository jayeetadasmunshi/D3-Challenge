//********************************************************* */
async function CreatePlot()
//********************************************************* */
{
  // Resetting SVG area - remove it if it isnt empty
  var svgArea = d3.select("body").select("svg");
  if (!svgArea.empty()) {
     svgArea.remove();
  }
  // Setting up our svg window based on the current width and height of browser window
  var svgWidth = 0.85*(window.innerWidth); // Graphic window width
  var svgHeight = 0.9*(window.innerHeight); // Graphic window height
  // Creating respective margins in pixels
  var margin = {
    top: 20,
    right: 20,
    bottom: 100,
    left: 100
  };
  // Available viewport : total window pixels - margins on both sides
  var width = svgWidth - margin.left - margin.right; 
  var height = svgHeight - margin.top - margin.bottom;
  // Create a SVG wrapper, append an SVG group that will hold our chart,
  var svg = d3
    .select("#scatter") // Selecting div with "scatter" id
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
    // Shift the svg wrapper by left and top margins.
    var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);
    // Using d3.csv method for fetching the data file
    let HealthData = await d3.csv("./assets/data/data.csv").catch(function(error){
        console.log(error); // log error in the console;
    });   
    //console.log(HealthData); // Display the data in the console
    console.log("Sample Size:" + HealthData.length); // Number of samples in the dataset

    // Change string (from CSV) into number format
    HealthData.forEach(function(data) {
              data.age = +data.age;
              data.poverty = +data.poverty;
              data.income = +data.income;
              data.healthcare = +data.healthcare;
              data.obesity = +data.obesity;
              data.smokes = +data.smokes;
    });
    
    // Let's create a scatter plot between two data variables namely `healthcare` vs. `poverty`.
    let selectXAxis = "poverty";
    let selectYAxis = "healthcare";

    // Defining the parameters of the axes
      let X_min = d3.min(HealthData, d => d[selectXAxis]); // Get minimum X data
      let X_max = d3.max(HealthData, d => d[selectXAxis]); // Get maximum X data
      let Y_min = d3.min(HealthData, d => d[selectYAxis]); // Get minimum Y data
      let Y_max = d3.max(HealthData, d => d[selectYAxis]); // Get maximum Y data

    // Creating scale functions
      var xLinearScale = d3.scaleLinear()
                        .domain([(X_min - 0.01*(X_min+X_max)), // Added padding 
                        (X_max + 0.01*(X_min+X_max))
                        ]) // domain is the range of input values
                        .range([0, width]) // range is the range of display values in pixels
                        .nice(); // expands both ends to the nearest round value
      var yLinearScale = d3.scaleLinear()
                         .domain([(Y_min - 0.02*(Y_min+Y_max)), // Added padding 
                          (Y_max + 0.02*(Y_min+Y_max))
                          ]) // domain is the range of input values
                          .range([height,0]) // flip order because origin is in upper left 
                          .nice(); // expands both ends to the nearest round value

    // Create axis functions
      var bottomAxis = d3.axisBottom(xLinearScale);
      var leftAxis = d3.axisLeft(yLinearScale);

    // Append Axes to the chart
      var xAxis = chartGroup.append("g") // Appending X axis
                            .attr("transform", `translate(0, ${height})`)
                            .classed("axisClr",true)
                            .call(bottomAxis);
      var yAxis = chartGroup.append("g") // Appending Y axis
                            .classed("axisClr",true)
                            .call(leftAxis);
    /******************* Circles ********************************* */            
    // Create Circles at each data point
      var circlesGroup = chartGroup.selectAll("circle")
                                   .data(HealthData)
                                   .enter()
                                   .append("g");
      var circlePoints =  circlesGroup.append("circle")
                                   .attr("cx", d => xLinearScale(d[selectXAxis]))
                                   .attr("cy", d => yLinearScale(d[selectYAxis]))
                                   .attr("fill","#89bdd3")
                                   .attr("stroke","#3a879e")
                                   .attr("r", "15") // radius of the circle
                                   .attr("stroke-width", 1.5);
    /******************* Circle Labels ********************************* */                      
    // Creating labels inside circles using the class stateText             
    var circleLabels = circlesGroup.selectAll(null)
                                    .data(HealthData)
                                    .enter()
                                    .append("text")
                                    .text(d => d.abbr)
                                    .attr("x",d => xLinearScale(d[selectXAxis]))
                                    .attr("y", d => yLinearScale(d[selectYAxis])+5)
                                    .attr("text-anchor", "middle")
                                    .classed("stateText",true); // Text style from d3Style.css

    /****************** Tool tip *************************************** */
    // function used for updating circles group with new tooltip
    function UpgradeToolTip(circlePoints, XAxis, YAxis) {
      let XPercent, YPercent = "";
      let XLabel, YLabel = "";
      switch(XAxis){
        case "poverty": XLabel = "Poverty"; XPercent = "%"; break;
        case "age": XLabel = "Age"; XPercent = "yrs"; break; // Age is in years
        case "income" : XLabel = "Income"; XPercent = ""; break; // Income is formatted separately
        default: XLabel =""; 
      }
      switch(YAxis){
        case "healthcare": YLabel = "Healthcare"; YPercent = "%"; break;
        case "smokes": YLabel = "smokes"; YPercent = "%"; break;
        case "obesity" : YLabel = "obesity"; YPercent = "%"; break;
        default: YLabel =""; 
      }
      var toolTip = d3.tip()
        .attr("class", "d3-tip")
        .style("position","absolute")
        .offset([50, -75])
        .html(function(d) {
          if(XAxis === "income"){
            let income = formatter.format(d[XAxis]); // Use constructor to covert into US currency
            return (`${d.state}<br>${XLabel}: ${income.substring(0, income.length-3)}${XPercent}<br>${YLabel}: ${d[YAxis]}${YPercent}`)  
          } else {
                return (`${d.state}<br>${XLabel}: ${d[XAxis]}${XPercent}<br>${YLabel}: ${d[YAxis]}${YPercent}`)
          };
        });
      // Initiate Tool tip
      circlePoints.call(toolTip);

      // mouseover event
      circlePoints.on("mouseover", function(data) {
          toolTip.show(data, this);
          })
        // onmouseout event
        .on("mouseout", function(data) {
            toolTip.hide(data, this);
        });

    return circlePoints;
    }
    // Intl.NumberFormat object is a constructor for objects that enable language sensitive
    var formatter = new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
    }); // Converting income into US currency

    // initialize tooltips
    circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);
   
   /****************** Group of X Axis Labels************************************** */ 
   // Create a group for X axes labels
    let Grouped_XLabels = chartGroup.append("g")
                      .attr("transform", `translate(${width / 2}, ${height + margin.top + 20})`);
    // Create three labels corresponding to poverty, age and income                 
    let PovertyLabel = Grouped_XLabels.append("text")                 
                      .text("In Poverty (%)") // Label text
                      .attr("dy", 0) // Offset by 0 px
                      .attr("value","poverty") // Setting object's value property 
                      .attr("class", "active")
                      .on("click", function(){
                                PovertyLabel.classed("active",true).classed("inactive",false);
                                IncomeLabel.classed("inactive",true).classed("active",false);
                                AgeLabel.classed("inactive",true).classed("active",false);
                                xAxis = UpdateXAxis("poverty", xAxis);
                                circlePoints = UpdateXPosition("poverty", circlePoints, "#89bdd3", "#3a879e");
                                circleLabels = UpdateXLabels("poverty", circleLabels);
                                selectXAxis = "poverty";
                                circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);
                              }
                          );
    let AgeLabel = Grouped_XLabels.append("text")                 
                      .text("Age (Median)") // Label text
                      .attr("dy", 20) // Offset by 20 px
                      .attr("value","age")
                      .attr("class", "inactive")
                      .on("click", function(){
                                PovertyLabel.classed("inactive",true).classed("active",false);
                                IncomeLabel.classed("inactive",true).classed("active",false);
                                AgeLabel.classed("active",true).classed("inactive",false);
                                xAxis = UpdateXAxis("age", xAxis);
                                circlePoints = UpdateXPosition("age", circlePoints, "#a9c653", "#70c653" );
                                circleLabels = UpdateXLabels("age", circleLabels);
                                selectXAxis = "age";
                                circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);
                              }
                          );
    let IncomeLabel = Grouped_XLabels.append("text")                 
                      .text("Household Income (Median)") // Label text
                      .attr("dy", 40) // Offset by 40 px
                      .attr("value","income")
                      .attr("class", "inactive")
                      .on("click", function(){
                                PovertyLabel.classed("inactive",true).classed("active",false);
                                IncomeLabel.classed("active",true).classed("inactive",false);
                                AgeLabel.classed("inactive",true).classed("active",false);
                                xAxis = UpdateXAxis("income", xAxis);
                                circlePoints = UpdateXPosition("income", circlePoints, "#ffad33", "#e68a00");
                                circleLabels = UpdateXLabels("income", circleLabels);
                                selectXAxis = "income";
                                circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);
                              }
                          );
    /****************** Group of Y Axis Labels************************************** */            
    // Create a group for Y axes labels
    let Grouped_YLabels = chartGroup.append("g")
                      .attr("transform", "rotate(-90)")
                     
    // Create three labels corresponding to healthcare, smokes and obese                 
    let HealthcareLabel = Grouped_YLabels.append("text") 
                      .attr("y", 0 - margin.left + 60) // Label y position 
                      .attr("x", 0 - (height / 2)) // Label x position 
                      .text("Lacks Healthcare (%)") // Label text
                      .attr("value","healthcare") // Setting object's value property 
                      .attr("class", "active")
                      .on("click", function(){
                                HealthcareLabel.classed("active",true).classed("inactive",false);
                                SmokesLabel.classed("inactive",true).classed("active",false);
                                ObeseLabel.classed("inactive",true).classed("active",false);
                                yAxis = UpdateYAxis("healthcare",yAxis);
                                circlePoints = UpdateYPosition("healthcare", circlePoints, "#ff9999", "#ff6666");
                                circleLabels = UpdateYLabels("healthcare", circleLabels);
                                selectYAxis = "healthcare";
                                circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);
                              }
                          );
    let SmokesLabel = Grouped_YLabels.append("text") 
                      .attr("y", 0 - margin.left + 40) // Label y position 
                      .attr("x", 0 - (height / 2)) // Label x position 
                      .text("Smokes (%)") // Label text
                      .attr("value","smokes") // Setting object's value property 
                      .attr("class", "inactive")
                      .on("click", function(){
                                HealthcareLabel.classed("inactive",true).classed("active",false);
                                SmokesLabel.classed("active",true).classed("inactive",false);
                                ObeseLabel.classed("inactive",true).classed("active",false);
                                yAxis = UpdateYAxis("smokes",yAxis);
                                circlePoints = UpdateYPosition("smokes", circlePoints, "#ffaa80", "#ff7733");
                                circleLabels = UpdateYLabels("smokes", circleLabels);
                                selectYAxis = "smokes";
                                circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);
                              }
                          );                
    let ObeseLabel = Grouped_YLabels.append("text") 
                      .attr("y", 0 - margin.left + 20) // Label y position 
                      .attr("x", 0 - (height / 2)) // Label x position 
                      .text("Obese (%)") // Label text
                      .attr("value","obesity") // Setting object's value property 
                      .attr("class", "inactive")
                      .on("click", function(){
                                HealthcareLabel.classed("inactive",true).classed("active",false);
                                SmokesLabel.classed("inactive",true).classed("active",false);
                                ObeseLabel.classed("active",true).classed("inactive",false);
                                yAxis = UpdateYAxis("obesity",yAxis);
                                circlePoints = UpdateYPosition("obesity", circlePoints, "#cccc00", "#999900");
                                circleLabels = UpdateYLabels("obesity", circleLabels);
                                selectYAxis = "obesity";
                                circlePoints = UpgradeToolTip(circlePoints, selectXAxis, selectYAxis);
                              }
                          );         

    /**************** Updating X axis parameters ******************************************** */                      
    // Function that updates X axis everytime a "click" event happens
    function UpdateXAxis(newLabel, newXAxis) {
      // Defining the parameters of the axes
      let X_min = d3.min(HealthData, d => d[newLabel]); // Get minimum X data
      let X_max = d3.max(HealthData, d => d[newLabel]); // Get maximum X data
      var xLinearScale = d3.scaleLinear()
                            .domain([(X_min - 0.01*(X_min+X_max)), // Added padding 
                            (X_max + 0.01*(X_min+X_max))
                            ]) // domain is the range of input values
                            .range([0, width]) // range is the range of display values in pixels
                            .nice(); // expands both ends to the nearest round value
      // Create axis functions
      var bottomAxis = d3.axisBottom(xLinearScale);
      // Add transition to the newXAxis
      newXAxis.transition()
              .duration(500)
              .call(bottomAxis);
      return newXAxis; // Return updated Axis parameters
    }      
    // Function that updates the x position of the circles everytime a "click" event happens
    function UpdateXPosition(newLabel, newXPos, fillColor, strokeColor){
      // Calculating new linearScale
      let X_min = d3.min(HealthData, d => d[newLabel]); // Get minimum X data
      let X_max = d3.max(HealthData, d => d[newLabel]); // Get maximum X data
      var xLinearScale = d3.scaleLinear()
                            .domain([(X_min - 0.01*(X_min+X_max)), // Added padding 
                            (X_max + 0.01*(X_min+X_max))
                            ]) // domain is the range of input values
                            .range([0, width]) // range is the range of display values in pixels
                            .nice(); // expands both ends to the nearest round value
      // Add transition to the new_X_Position
      newXPos.transition()
             .duration(500)
             .attr("cx", d => xLinearScale(d[newLabel]))
             .attr("fill", fillColor)
             .attr("stroke", strokeColor);
      return newXPos; // Return updated circle x position
    }
    // Function that updates x position of labels everytime a "click" event happens
    function UpdateXLabels(newLabel, NewCircleLabels){
      // Calculating new linearScale
      let X_min = d3.min(HealthData, d => d[newLabel]); // Get minimum X data
      let X_max = d3.max(HealthData, d => d[newLabel]); // Get maximum X data
      var xLinearScale = d3.scaleLinear()
                            .domain([(X_min - 0.01*(X_min+X_max)), // Added padding 
                            (X_max + 0.01*(X_min+X_max))
                            ]) // domain is the range of input values
                            .range([0, width]) // range is the range of display values in pixels
                            .nice(); // expands both ends to the nearest round value
      // Add transition to the new Circle Labels
      NewCircleLabels.transition()
                     .duration(500)
                     .attr("x", d => xLinearScale(d[newLabel]))
                     .attr("text-anchor", "middle");
      return NewCircleLabels; // Return updated label x position
    }

   
   /**************** Updating Y axis parameters ******************************************** */ 
    // Function that updates Y axis everytime a "click" event happens
    function UpdateYAxis(newLabel, newYAxis) {
      // Defining the parameters of the axes
      let Y_min = d3.min(HealthData, d => d[newLabel]); // Get minimum Y data
      let Y_max = d3.max(HealthData, d => d[newLabel]); // Get maximum Y data
      var yLinearScale = d3.scaleLinear()
                         .domain([(Y_min - 0.02*(Y_min+Y_max)), // Added padding 
                          (Y_max + 0.02*(Y_min+Y_max))
                          ]) // domain is the range of input values
                          .range([height,0]) // flip order because origin is in upper left 
                          .nice(); // expands both ends to the nearest round value
      // Create axis functions
      var leftAxis = d3.axisLeft(yLinearScale);
      // Add transition to the newYAxis
      newYAxis.transition()
              .duration(500)
              .call(leftAxis);
      return newYAxis; // Return updated Axis parameters
    }
    // Function that updates the x position of the circles everytime a "click" event happens
    function UpdateYPosition(newLabel, newYPos, fillColor, strokeColor){
      // Calculating new linearScale
      let Y_min = d3.min(HealthData, d => d[newLabel]); // Get minimum X data
      let Y_max = d3.max(HealthData, d => d[newLabel]); // Get maximum X data
      var yLinearScale = d3.scaleLinear()
                        .domain([(Y_min - 0.02*(Y_min+Y_max)), // Added padding 
                        (Y_max + 0.02*(Y_min+Y_max))
                        ]) // domain is the range of input values
                        .range([height,0]) // flip order because origin is in upper left 
                        .nice(); // expands both ends to the nearest round value
      // Add transition to the new_X_Position
      newYPos.transition()
             .duration(500)
             .attr("cy", d => yLinearScale(d[newLabel]))
             .attr("fill", fillColor)
             .attr("stroke", strokeColor);
      return newYPos; // Return updated circle x position
    }  
    // Function that updates x position of labels everytime a "click" event happens
    function UpdateYLabels(newLabel, NewCircleLabels){                   
       // Calculating new linearScale
      let Y_min = d3.min(HealthData, d => d[newLabel]); // Get minimum Y data
      let Y_max = d3.max(HealthData, d => d[newLabel]); // Get maximum Y data
      var yLinearScale = d3.scaleLinear()
                        .domain([(Y_min - 0.02*(Y_min+Y_max)), // Added padding 
                          (Y_max + 0.02*(Y_min+Y_max))
                          ]) // domain is the range of input values
                          .range([height,0]) // flip order because origin is in upper left 
                          .nice(); // expands both ends to the nearest round value
      // Add transition to the new Circle Labels
      NewCircleLabels.transition()
                    .duration(500)
                    .attr("y", d => yLinearScale(d[newLabel])+5)
                    .attr("text-anchor", "middle");
      return NewCircleLabels; // Return updated label x position
    } 
        
}
// When the browser loads, makeResponsive() is called.
CreatePlot();

// When the browser window is resized, responsify() is called.
d3.select(window).on("resize", CreatePlot);