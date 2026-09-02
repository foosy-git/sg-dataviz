const fs = require('fs');

async function test() {
    const [birthRes, incomeRes, coeRes, climateRes] = await Promise.all([
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_e39eeaeadb571c0d0725ef1eec48d166&limit=100'),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_c74ebe613db891d25e4836aaf98d7a47&limit=100'),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_69b3380ad7e51aff3a7dcc84eba52b8a&limit=50000'),
      fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_755290a24afe70c8f9e8bcbf9f251573&limit=10000')
    ]);

    const birthData = (await birthRes.json()).result?.records || [];
    const incomeData = (await incomeRes.json()).result?.records || [];
    const coeData = (await coeRes.json()).result?.records || [];
    const climateData = (await climateRes.json()).result?.records || [];
    const hdbData = [];

    const yearsMap = {};

    const initYear = (y) => {
      if (!yearsMap[y]) yearsMap[y] = { 
        year: y, birthRate: null, medianIncome: null, 
        coeSum: 0, coeCount: 0, hdbSum: 0, hdbCount: 0, 
        tempSum: 0, tempCount: 0 
      };
    };

    if (birthData.length > 0) {
      const yearKeys = Object.keys(birthData[0]).filter(k => !isNaN(Number(k)));
      for (const year of yearKeys) {
        initYear(Number(year));
        const series = birthData.find((r) => r.DataSeries.includes('Total Fertility Rate'));
        if (series) {
          const value = series[year];
          yearsMap[Number(year)].birthRate = (value === 'na' || value === 'n.a.' || value === '-' || !value) ? null : parseFloat(value);
        }
      }
    }

    for (const row of incomeData) {
      if (row.Dollar) {
        const y = parseInt(row.Dollar);
        initYear(y);
        yearsMap[y].medianIncome = Number(row.ResidentEmployedHouseholds_Median1);
      }
    }

    for (const row of coeData) {
      if (row.vehicle_class === 'Category A' || row.vehicle_class === 'Category A (Cars up to 1600cc and 97kW)' || row.vehicle_class === 'Category A (Cars up to 1600cc & 97kW)') {
        const y = parseInt(row.month.split('-')[0]);
        initYear(y);
        yearsMap[y].coeSum += Number(row.premium);
        yearsMap[y].coeCount += 1;
      }
    }

    for (const row of climateData) {
      if (row.month) {
        const y = parseInt(row.month.split('-')[0]);
        initYear(y);
        yearsMap[y].tempSum += Number(row.mean_temp);
        yearsMap[y].tempCount += 1;
      }
    }

    for (const row of hdbData) {
      initYear(row.year);
      yearsMap[row.year].hdbSum += row.resalePrice;
      yearsMap[row.year].hdbCount += 1;
    }

    const timelineData = Object.values(yearsMap).map((d) => ({
      year: d.year,
      birthRate: d.birthRate,
      medianIncome: d.medianIncome,
      coePremium: d.coeCount > 0 ? Math.round(d.coeSum / d.coeCount) : null,
      hdbPrice: d.hdbCount > 0 ? Math.round(d.hdbSum / d.hdbCount) : null,
      temperature: d.tempCount > 0 ? Number((d.tempSum / d.tempCount).toFixed(2)) : null,
    })).sort((a, b) => a.year - b.year);

    const filteredTimeline = timelineData.filter(d => d.year >= 2010 && d.year <= 2024);
    
    console.log(filteredTimeline);
}

test();
