// location of data
const countyUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";
const edUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";


const colors = [
    {
        color: "#caf0f8"
    },
    {
        color: "#90e0ef"
    },
    {
        color: "#00b4d8"
    },
    {
        color: "#0077b6"
    },
    {
        color: "#023e8a"
    }
];

const WIDTH = 850;
const HEIGHT = 550;
const LEGEND_WIDTH = 200;
const LEGEND_HEIGHT = 200 / colors.length;

// global variables
let countyData;
let educationData;
let stateData;
let minPercent;
let maxPercent;

// build tooltip
let tip = d3.tip()
    .attr("class", "text-center")
    .attr("class", "card py-2 px-4")
    .attr("id", "tooltip")
    .offset([-10,0]);

// build the svg on the 
let svg = d3.select(".chloropleth-map")
    .append("svg")
    .attr("id", "chloropleth-map")
    .attr("viewBox", `0 0 ${WIDTH + 100} ${HEIGHT + 100}`)
    .call(tip);

// helper function to get get colors step values
const getColorStepValues = (colors, data) => {
    
    const percents = data.map(d => d.bachelorsOrHigher);
    minPercent = Math.min(...percents);
    maxPercent = Math.max(...percents);
    
    const step = (maxPercent - minPercent)/colors.length;
    
    colors.forEach((color,i) => color.stepValue = maxPercent - (step * (i + 1)));
}

// helper function to get color values
const getColor = (percent) => {
    for(let i = 0; i < colors.length; i++) {
        if(percent >= colors[i].stepValue) {
            return colors[i].color;
        }
    }
    return colors[colors.length - 1];
}

// we draw the map bassed on contry data, from bnth json files.
const drawMap = () => {

    svg.selectAll("path")
        .data(countyData)
        .enter()
        .append("path")
        .attr("d", d3.geoPath())
        .attr("class", "county")
        .attr("fill", county => {
            let currCounty = educationData.find(d => d.fips == county.id);
            return getColor(currCounty.bachelorsOrHigher);
        })
        .attr("data-fips", county => educationData.find(d => d.fips == county.id).fips)
        .attr("data-education", county =>  d3.format(".2f")(educationData.find(d => d.fips == county.id).bachelorsOrHigher))
        .on("mouseover", (event, county) => {
            let name = educationData.find(d => d.fips == county.id).area_name;
            let percent = d3.format(".2f")(educationData.find(d => d.fips == county.id).bachelorsOrHigher);
            
            tip.attr("data-education", percent);
            tip.html(`${name}<br>${percent}%`);
            tip.show(event);
        })
        .on("mouseout", tip.hide);



    // legend scale
    const legendScale = d3.scaleLinear()
        .domain([minPercent, maxPercent])
        .range([0, LEGEND_WIDTH]);

    const stepValues = colors.map(color => color.stepValue)

    // set up axis
    const legendAxis = d3.axisBottom()
        .scale(legendScale)
        .tickSize(10,0)
        .tickValues([...stepValues])
        .tickFormat(d => {
            const format = d3.format(".2f");
            return `${format(d)}%`
        });

    // add legend to svg
    const legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate(650,30)");

    legend.append("g")
        .selectAll("rect")
        .data(colors)
        .enter()
        .append("rect")
        .attr("x", d => legendScale(d.stepValue))
        .attr("y", 0)
        .attr("WIDTH", LEGEND_WIDTH/colors.length)
        .attr("HEIGHT", LEGEND_HEIGHT)
        .attr("fill", d => d.color)
        .on("mouseover", (event,d,i) => {
            tip.html(`${d.color}`)
            tip.show(event);
        })
        .on("mouseout", tip.hide);

        // add legend axis
        legend.append("g")
        .attr("transform", `translate(0,${LEGEND_HEIGHT})`)
        .call(legendAxis);

}


d3.json(countyUrl)
.then((data, error) => {
    
    if(error) {
        console.log(error);
    }

    else {
        
        countyData = topojson.feature(data, data.objects.counties).features;
        stateData = topojson.feature(data, data.objects.states).features;

        d3.json(edUrl)
        .then((data,error) => {
            if(error) {
                // TODO display error on html page
                console.log(error);
            }

            else {
                educationData = data;
                getColorStepValues(colors, data);
                drawMap();

            }
        });

    }
});