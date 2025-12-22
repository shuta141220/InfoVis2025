const width = 256;
const height = 400;
const padding = 10;
const bar_height = 20;


const svg = d3.select('#drawing_region')
    .attr('width', width)
    .attr('height', height);

let data;

d3.csv("https://shuta141220.github.io/InfoVis2025/W10/w10_task1.csv")
    .then(csv => {
        csv.forEach(d => d.value = +d.value);
        data = csv;
        update(data);
    });

function update(data) {

    const max_value = d3.max(data, d => d.value);

    const xscale = d3.scaleLinear()
        .domain([0, max_value])
        .range([0, width - 100]);

    svg.selectAll("rect")
        .data(data, d => d.label)
        .join("rect")
        .transition()
        .duration(1000)
        .attr("x", 80)
        .attr("y", (d, i) => padding + i * (bar_height + padding))
        .attr("width", d => xscale(d.value))
        .attr("height", bar_height)
        .attr("fill", "black");

    svg.selectAll("text.label")
        .data(data, d => d.label)
        .join("text")
        .attr("class", "label")
        .transition()
        .duration(1000)
        .attr("x", 0)
        .attr("y", (d, i) =>
            padding + i * (bar_height + padding) + bar_height * 0.8
        )
        .text(d => d.label)
        .attr("font-size", "10px");
}

d3.select('#reverse')
    .on('click', () => {
        data.reverse();
        update(data);
    });