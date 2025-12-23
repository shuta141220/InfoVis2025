d3.csv("https://shuta141220.github.io/InfoVis2025/W10/w10_task2.csv")
    .then(data => {

        data.forEach(d => {
            d.x = +d.x;
            d.y = +d.y;
            d.r = 5;
        });

        draw(data);
    });

function draw(data) {

    const width  = 256;
    const height = 256;
    const margin = { top: 30, right: 20, bottom: 30, left: 40 };

    const svg = d3.select('#drawing_region')
        .attr('width', width)
        .attr('height', height);

    const chart = svg.append('g')
        .attr('transform',
            `translate(${margin.left}, ${margin.top})`);

    const inner_width  = width  - margin.left - margin.right;
    const inner_height = height - margin.top  - margin.bottom;

    const xscale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .range([0, inner_width]);

    const yscale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .range([inner_height, 0]);

    chart.append('g')
        .attr('transform', `translate(0, ${inner_height})`)
        .call(d3.axisBottom(xscale).ticks(5));

    chart.append('g')
        .call(d3.axisLeft(yscale).ticks(5));

    const circles = chart.selectAll('circle')
        .data(data)
        .enter()
        .append('circle');

    circles
        .attr('cx', d => xscale(d.x))
        .attr('cy', d => yscale(d.y))
        .attr('r', d => d.r)
        .attr('fill', 'black');

    circles
        .on('mouseover', (e, d) => {

            d3.select(e.currentTarget)
                .attr('fill', 'red');

            d3.select('#tooltip')
                .style('opacity', 1)
                .html(`
                    <div class="tooltip-label">Position</div>
                    (${d.x}, ${d.y})
                `);
        })
        .on('mousemove', (e) => {
            const padding = 10;
            d3.select('#tooltip')
                .style('left', (e.pageX + padding) + 'px')
                .style('top',  (e.pageY + padding) + 'px');
        })
        .on('mouseleave', (e) => {

            d3.select(e.currentTarget)
                .attr('fill', 'black');

            d3.select('#tooltip')
                .style('opacity', 0);
        });

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text('散布図');

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text('X Label');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text('Y Label');
}