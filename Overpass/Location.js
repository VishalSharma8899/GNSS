 
const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/location-info', async (req, res) => {
  const { lat1, lon1, lat2, lon2 } = req.body;

  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return res.status(400).send('Missing required body parameters');
  }

  console.log(`Received parameters - lat1: ${lat1}, lon1: ${lon1}, lat2: ${lat2}, lon2: ${lon2}`);

  const overpassQuery = `
    [out:json];
    (
      node(around:50, ${lat1}, ${lon1})["highway"];
      node(around:50, ${lat2}, ${lon2})["highway"];
      way(around:50, ${lat1}, ${lon1})["highway"];
       way(around:50, ${lat2}, ${lon2})["highway"];
    );
    out body;
  `;

  try {
    console.log('Overpass API Query:', overpassQuery);

    const overpassResponse = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
      headers: { 'Content-Type': 'text/plain' }
    });
    console.log(overpassResponse);

    const roads = overpassResponse.data.elements.map(element => {
      const roadType = element.tags.highway;
      let roadCategory = 'Unknown';

      if (roadType) {
        if (['motorway', 'trunk'].includes(roadType)) {
          roadCategory = 'National Highway';
        } else if (['primary', 'secondary'].includes(roadType)) {
          roadCategory = 'State Highway';
        } else if (['service'].includes(roadType)) {
          roadCategory = 'Service Road';
        } else if (['residential', 'tertiary'].includes(roadType)) {
          roadCategory = 'Local Road';
        }
        // Add more categories as needed
      }

      return {
        
        id: element.id,
        type: element.type,
        roadType: roadType || 'unknown',
        roadCategory
      };
    });

    const place1 = await getPlaceNameFromCoordinates(lat1, lon1);
    const place2 = await getPlaceNameFromCoordinates(lat2, lon2);

    res.json({
      roads,
      places: [place1, place2]
    });

  } catch (error) {
    console.error('Error querying Overpass API:', error);
    res.status(500).send('Error querying Overpass API');
  }
});

// Reverse geocoding function
async function getPlaceNameFromCoordinates(lat, lon) {
  try {
    console.log(`Reverse geocoding for lat: ${lat}, lon: ${lon}`);
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat: encodeURIComponent(lat),
        lon: encodeURIComponent(lon),
        format: 'json'
      }
    });
    return response.data.address;
  } catch (error) {
    console.error('Error with reverse geocoding:', error.response ? error.response.data : error.message);
    return null;
  }
}

module.exports = router;
