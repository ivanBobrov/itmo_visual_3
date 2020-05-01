const b_width = 1000;
const d_width = 500;
const b_height = 1000;
const d_height = 1000;
const colors = [
    '#DB202C','#a6cee3','#1f78b4',
    '#33a02c','#fb9a99','#b2df8a',
    '#fdbf6f','#ff7f00','#cab2d6',
    '#6a3d9a','#ffff99','#b15928']

const radius = d3.scaleLinear().range([.5, 20]);
const color = d3.scaleOrdinal().range(colors);
const x = d3.scaleLinear().range([0, b_width]);

const bubble = d3.select('.bubble-chart')
    .attr('width', b_width).attr('height', b_height);
const donut = d3.select('.donut-chart')
    .attr('width', d_width).attr('height', d_height)
    .append("g")
        .attr("transform", "translate(" + d_width / 2 + "," + d_height / 2 + ")");

const donut_label = d3.select('.donut-chart').append('text')
        .attr('class', 'donut-lable')
        .attr("text-anchor", "middle")
        .attr('transform', `translate(${(d_width/2)} ${d_height/2})`);
const tooltip = d3.select('.tooltip');
const tooltip_name = tooltip.append('div').attr('class', 'title');
const tooltip_year = tooltip.append('div').attr('class', 'year');
const tooltip_offset = 20;

//  Part 1 - Create simulation with forceCenter(), forceX() and forceCollide()
const simulation = d3.forceSimulation();


d3.csv('data/netflix.csv').then(data=>{
    data = d3.nest().key(d=>d.title).rollup(d=>d[0]).entries(data).map(d=>d.value).filter(d=>d['user rating score']!=='NA');
    console.log(data)
    
    const rating = data.map(d=>+d['user rating score']);
    const years = data.map(d=>+d['release year']);
    let ratings = d3.nest().key(d=>d.rating).rollup(d=>d.length).entries(data);
    const ratingsSet = ratings.map(e => e.key);
    console.log(ratingsSet)
    

    // Part 1 - add domain to color, radius and x scales
    const rScale = d3.scaleLinear().range([1, 15]).domain([d3.min(rating), d3.max(rating)])
    const xScale = d3.scaleLinear().range([0, b_width]).domain([d3.min(years), d3.max(years)])
    const colorScale = d3.scaleOrdinal().range(colors).domain(ratingsSet)


    // Part 1 - create circles
    var nodes = bubble
        .selectAll("circle")
        .data(data).enter()
        .append('circle')
        .attr('r', (d, i) => rScale(+d['user rating score']))
        .attr('fill', (d, i) => colorScale(d['rating']))
        .attr('stroke', 'black')
        .attr('stroke-width', 0)
        .on('mouseover', overBubble)
        .on('mouseout', outOfBubble);
    
    // Part 1 - add data to simulation and add tick event listener
    simulation.nodes(data)
        .on('tick', () => nodes.attr('cx', d => d.x).attr('cy', d => d.y))
        .force('center', d3.forceCenter(b_width / 2, b_height / 2))
        .force('collision', d3.forceCollide().radius((d, i) => rScale(rating[i]) + 2))
        .force('x', d3.forceX((d, i) => xScale(years[i])).strength(2))
        .force('y', d3.forceY(b_height / 2).strength(0.05));

    // Part 1 - create layout with d3.pie() based on rating
    const pie = d3.pie().value(d => d.value)
    const pie_data = pie(ratings)
    
    // Part 1 - create an d3.arc() generator
    var arc = donut.selectAll('arc')
        .data(pie_data).enter()
        .append('path')
        .attr('d', d3.arc()
            .innerRadius(d_width / 3)
            .outerRadius(d_width / 2)
            .cornerRadius(10))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('fill', d => colorScale(d.data.key))
        .on('mouseover', overArc)
        .on('mouseout', outOfArc);

    function overBubble(d){
        console.log(d)

        // Part 2 - add stroke and stroke-width
        d3.select(this).attr('stroke-width', 1);
        
        // Part 3 - update tooltip content with title and year
        tooltip_name.html(d['title']);
        tooltip_year.html(d['release year']);

        // Part 3 - change visibility and position of tooltip
        tooltip.style('display', 'block');
        tooltip.style('left', d.x + tooltip_offset + 'px');
        tooltip.style('top', d.y + tooltip_offset + 'px');
    }

    function outOfBubble(){
        // Part 2 - remove stroke and stroke-width
        d3.select(this).attr('stroke-width', 0);
            
        // Part 3 - change visibility of tooltip
        tooltip.style('display', 'none');
    }

    function overArc(d){
        console.log(d)

        // Part 2 - change donut_label content
        donut_label.html(d.data.key);

        // Part 2 - change opacity of an arc
        d3.select(this).attr('opacity', .5);

        // Part 3 - change opacity, stroke и stroke-width of circles based on rating
        bubble.selectAll('circle')
            .data(data)
            .attr('opacity', e => e['rating'] === d.data.key ? 1 : .2)
            .attr('stroke-width', e => e['rating'] === d.data.key ? 1 : 0);
    }

    function outOfArc(){
        // Part 2 - change content of donut_label
        donut_label.html('');

        // Part 2 - change opacity of an arc
        d3.select(this).attr('opacity', 1);

        // Part 3 - revert opacity, stroke and stroke-width of circles
        bubble.selectAll('circle')
            .data(data)
            .attr('opacity', 1)
            .attr('stroke-width', 0);
    }
});
