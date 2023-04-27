// bigfoot link 'https://query.data.world/s/7cixulhlknr7m4lg3wnyoiknklztds?dws=00000'

$.getJSON("bigfoot_geo.json", function(bigfoot) {
  console.log( "Loaded in bigfoot data" );
})
  .done(function(bigfoot) {

    $.getJSON('https://unpkg.com/us-atlas@3.0.1/counties-10m.json').then((us) => {
    const nation = ChartGeo.topojson.feature(us, us.objects.nation).features[0];
    const states = ChartGeo.topojson.feature(us, us.objects.states).features;
    const counties = ChartGeo.topojson.feature(us,us.objects.counties).features;
    //function createData(states, bfro) {
    let temp =  states.map((d) => ({feature: d, value: 0}));
    bigfoot.forEach(element => {
      let index = temp.findIndex(obj => obj.feature.properties.name == element.state);
      temp[index].value = temp[index].value + 1;
      })
    //}
    let chart;
    let bubchart;
  
    /****************************
     Bubblechart dropdown    
    *****************************/
    $('#bubble').on("input", function(){
      console.log($('#bubble').val());
      let newID = $('#bubble').val();
      if (newID == 0) {
        bubchart.destroy();
        let colors = bubbleData.map(e =>  e.class == "Class A" ? 'rgba(7, 43, 17, .8)' : e.class == "Class B" ? 'rgba(56, 166, 86, .8)' : 'rgba(134, 184, 148, 1)');
        
        bubchart = new Chart(document.getElementById("canvas2").getContext("2d"), {
          type: 'bubbleMap', 
          data: {
            labels: bubbleData.map((d) => d.id),
            datasets: [{
              outline: states,
              showOutline: true,
              pointStyle: 'rect',
              backgroundColor: colors,
              data: bubbleData,
              radius: 5, 
            }]
          },
          options: {
            elements: {
              geoFeature: {
                outlineBorderColor: 'rgb(115, 112, 111)',
              },
            },
            plugins: {
              tooltip: {
                enabled: false,
                position: 'nearest',
                external: externalTooltipHandler,
              },
              legend: {
                display: false
              },
              datalabels: {
                align: 'top',
                formatter: (v) => {
                  return v.id;
                }
              },
            },
            scales: {
              projection: {
                axis: 'x',
                projection: 'albersUsa', 
              },
              size: {
                axis: 'x',
                size: [1, 2],
                mode: 'radius',
                display: false,
              },
            }
          }
        }); 
      }
      else { 
        let index = states.findIndex((state) => state.id == newID);
        // Grabbing counties based on state
        const state = counties.filter(e => RegExp("^" + states[index].id + "\\d\\d\\d$").test(e.id));
        // filter bigfoot for entries from the state
        let bigfoottemp = bigfoot.filter((entry) => entry.state == states[index].properties.name);
        let geofilter = bigfoottemp.filter((e) => !!(e.latitude || e.longitude));
        newBubbleData = geofilter.map((e) => ({id: e.number, longitude: e.longitude, latitude: e.latitude, value: 0}));
        newBubbleData = geofilter.map((e) => ({id: e.title ? e.title : `Report ${e.number}`, longitude: e.longitude, latitude: e.latitude, value: 0, state: e.state, county: e.county, observed: e.observed, class: e.classification, weather: e.summary ? e.summary : "No data available", date: e.date ? e.date : "No data avaialble"}));
        let newColors = newBubbleData.map(e =>  e.class == "Class A" ? 'rgba(7, 43, 17, .8)' : e.class == "Class B" ? 'rgba(56, 166, 86, .8)' : 'rgba(134, 184, 148, 1)')
        let countyData = state.map(county => ({feature: county, value: 0}));
        bubchart.destroy();
        bubchart = new Chart(document.getElementById("canvas2").getContext("2d"), {
          type: 'bubbleMap', 
          data: {
            labels: bubbleData.map((d) => d.id),
            datasets: [{
              outline: state,
              showOutline: true,
              backgroundColor: newColors,
              borderColor: 'black',
              pointStyle: 'rect',
              data: newBubbleData,
              radius: 5, 
            }]
          },
          options: {
            elements: {
              geoFeature: {
                outlineBorderColor: 'rgb(115, 112, 111)',
              },
            },
            plugins: {
              tooltip: {
                enabled: false,
                position: 'nearest',
                external: externalTooltipHandler,
              },
              legend: {
                display: false
              },
              datalabels: {
                align: 'top',
                formatter: (v) => {
                  return v.id;
                }
              },
            },
            scales: {
              projection: {
                axis: 'x',
                projection: 'albersUsa', 
              },
              size: {
                axis: 'x',
                size: [1, 2],
                mode: 'radius',
                display: false,
              },
            }
          }
        });
      }
    });

    // Extenernal Block
    const getOrCreateTooltip = (chart) => {
      let tooltipEl = chart.canvas.parentNode.querySelector('div');
    
      if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.style.background = 'rgba(0, 0, 0, 0.7)';
        tooltipEl.style.borderRadius = '3px';
        tooltipEl.style.color = 'white';
        tooltipEl.style.opacity = 1;
        tooltipEl.style.pointerEvents = 'none';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.transform = 'translate(-10%, 0)';
        tooltipEl.style.transition = 'all .1s ease';
    
        const table = document.createElement('table');
        table.style.margin = '0px';
    
        tooltipEl.appendChild(table);
        chart.canvas.parentNode.appendChild(tooltipEl);
      }
    
      return tooltipEl;
    };
    
    const externalTooltipHandler = (context) => {
      // Tooltip Element
      const {chart, tooltip} = context;
      const tooltipEl = getOrCreateTooltip(chart);
    
      // Hide if no tooltip
      if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
      }
    
      // Set Text
      if (tooltip.body) {
        const bodyLines =[`${context.tooltip._tooltipItems[0].raw.id}`, context.tooltip._tooltipItems[0].raw.class, `State: ${context.tooltip._tooltipItems[0].raw.state}`, `County: ${context.tooltip._tooltipItems[0].raw.county}`,`Date: ${context.tooltip._tooltipItems[0].raw.date}`, `Weather: ${context.tooltip._tooltipItems[0].raw.weather}`, `Observed: ${context.tooltip._tooltipItems[0].raw.observed}`];
        const tableBody = document.createElement('tbody');
        bodyLines.forEach((body, i) => {
          const colors = tooltip.labelColors[i];
          
          const span = document.createElement('span');
          if (i == 0) {
          span.style.background = colors.backgroundColor;
          span.style.borderColor = colors.borderColor;
          }
          span.style.borderWidth = '2px';
          span.style.marginRight = '10px';
          span.style.height = '10px';
          span.style.width = '10px';
          span.style.display = 'inline-block';
    
          const tr = document.createElement('tr');
          tr.style.backgroundColor = 'inherit';
          tr.style.borderWidth = 0;
    
          const td = document.createElement('td');
          td.style.borderWidth = 0;
    
          const text = document.createTextNode(body);
    
          if (i == 0) {
            td.classList.add('bold');
            td.appendChild(span);
          } 
          td.appendChild(text);
          tr.appendChild(td);
          tableBody.appendChild(tr);

        });
    
        const tableRoot = tooltipEl.querySelector('table');
    
        // Remove old children
        while (tableRoot.firstChild) {
          tableRoot.firstChild.remove();
        }
        // Add new children
        tableRoot.appendChild(tableBody);
        

      }
    
      const {offsetLeft: positionX, offsetTop: positionY} = chart.canvas;
    
      // Display, position, and set styles for font
      tooltipEl.style.opacity = 1;
      tooltipEl.style.left = positionX + tooltip.caretX + 'px';
      tooltipEl.style.top = positionY + tooltip.caretY + 'px';
      tooltipEl.style.font = tooltip.options.bodyFont.string;
      tooltipEl.style.padding = tooltip.options.padding + 'px ' + tooltip.options.padding + 'px';
    };
    
    //
    //
    // When selector value changes, change the map
    $('#choro').on("input", function(){
      console.log($('#choro').val());
      let newID = $('#choro').val();
      if (newID == 0) {
        chart.data.labels = states.map((d) => d.properties.name);
        chart.data.datasets[0].outline = nation;
        chart.data.datasets[0].data = temp;
        chart.options.color.quantize = 200;
        chart.update();
      }
      else { 
        let index = states.findIndex((state) => state.id == newID);
        // Grabbing counties based on state
        const state = counties.filter(e => RegExp("^" + states[index].id + "\\d\\d\\d$").test(e.id));
        // filter bigfoot for entries from the state
        let bigfoottemp = bigfoot.filter((entry) => entry.state == states[index].properties.name);
        // then set up skeleton (i.e. each countie w/value = 0)
        let countyData = state.map(county => ({feature: county, value: 0}));
        // Fill with bigfoot
        bigfoottemp.forEach((entry) => {
          let cty = countyData.findIndex((s) => RegExp("^" + s.feature.properties.name + "\\sCounty").test(entry.county));
          if (cty >= 0) {
        countyData[cty].value = countyData[cty].value + 1; } else {console.log("-1: " + entry.county)}
          });

        chart.data.labels = state.map((d) => d.properties.name);
        chart.data.datasets[0].outline = states[index];
        chart.data.datasets[0].data = countyData;
        chart.options.color.quantize = 5;
        chart.update();
      }
    });

    // By default load the US map
    $(document).ready(function() {
      chart = new Chart(document.getElementById("canvas").getContext("2d"), {
        type: 'choropleth',
        data: {
          labels: states.map((d) => d.properties.name),
          datasets: [{
            label: 'States',
            outline: nation,
            data: temp,//states.map((d) => ({feature: d, value: Math.random() * 10})),
            }]
          },
        options: {
          elements: {
            geoFeature: {
              outlineBorderColor: 'rgb(115, 112, 111)',
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  return ` ${context.raw.value} sightings`;
                },
              },
            },
            legend: {
              display: false
            },
          },
          scales: {
            projection: {
              axis: 'x',
              projection: 'albersUsa',  
            },
            color: {
              axis: 'x',
              quantize: 200,
              interpolate: 'greens', 
              legend: {
                position: 'bottom-right',
                align: 'bottom',
                indicatorWidth: 15,
              },
            }
          },
        }
      });
      let bigfilter = bigfoot.filter((e) => !!(e.latitude || e.longitude));
      bubbleData = bigfilter.map((e) => ({id: e.title ? e.title : `Report ${e.number}`, longitude: e.longitude, latitude: e.latitude, value: 0, state: e.state, county: e.county, observed: e.observed, class: e.classification, weather: e.summary ? e.summary : "No data available", date: e.date ? e.date : "No data avaialble"}));
      let colors = bubbleData.map(e =>  e.class == "Class A" ? 'rgba(7, 43, 17, .8)' : e.class == "Class B" ? 'rgba(56, 166, 86, .8)' : 'rgba(134, 184, 148, 1)')

    bubchart = new Chart(document.getElementById("canvas2").getContext("2d"), {
      type: 'bubbleMap', 
      data: {
        labels: bubbleData.map((d) => d.class),
        datasets: [{
          outline: states,
          showOutline: true,
          pointStyle: 'rect',
          backgroundColor: colors,
          data: bubbleData,
          radius: 5, 
        }]
      },
      options: {
        elements: {
          geoFeature: {
            outlineBorderColor: 'rgb(115, 112, 111)',
          },
        },
        plugins: {
          tooltip: {
            enabled: false,
            position: 'nearest',
            external: externalTooltipHandler,
          },
          legend: {
            display: false
          },
        },
        scales: {
          projection: {
            axis: 'x',
            projection: 'albersUsa', 
          },
          size: {
            axis: 'x',
            size: [1, 2],
            mode: 'radius',
            display: false,
          },
        }
      }
    });

    });

    

  })
  })
  .fail(function() {
    console.log( "Failed to load data" );
    let c1 = document.getElementById("canvas2").getContext("2d");
    let c2 = document.getElementById("canvas").getContext("2d");
    c2.fillStyle = "red";
    c1.fillStyle = "red";
    c1.fillText("Failed to load the required data", (canvas.width / 2), (canvas.height / 2));
    c2.fillText("Failed to load the required data", (canvas.width / 2), (canvas.height / 2));
  }); 