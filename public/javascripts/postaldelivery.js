/**
 * Fetch and display postal delivery dates
 */

function fetchPostalDelivery() {
    const postalCode = config.postaldelivery.postalCode;
    const apiUrl = `/postaldelivery/${postalCode}`;
        
    fetch(apiUrl)
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data && data.length > 0 && data[0].deliveryDates) {
                displayPostalDelivery(data[0].deliveryDates);
            } else {
                console.error('Invalid data format:', data);
            }
        })
        .catch(error => {
            console.error('Error fetching postal delivery dates:', error);
        });
}

function displayPostalDelivery(deliveryDates) {
    const container = document.getElementById('postaldelivery');
        
    if (!container) {
        console.error('Postal delivery container not found!');
        return;
    }
    
    // Get current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter future dates and get next 2
    const futureDates = deliveryDates
        .map(dateStr => new Date(dateStr))
        .filter(date => date >= today)
        .slice(0, 3);
        
    if (futureDates.length === 0) {
        console.log('No future delivery dates found');
        container.innerHTML = '';
        return;
    }
    
    // Finnish weekday abbreviations
    const weekdaysFi = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'];
    
    let html = '<h3><img src="/images/Posti_Orange_rgb.png" class="posti-logo" alt="Posti">jakelupäivä</h3>';
    html += '<table><tbody>';
    
    futureDates.forEach((date, index) => {
        const weekday = weekdaysFi[date.getDay()];
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const dateText = `${weekday} ${day}.${month}`;
        
        // Normalize the date for comparison
        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);
        
        let content;
        if (index === 0 && normalizedDate.getTime() === today.getTime()) {
            // First date is today - show green badge
            content = `<span class="badge bg-success">${dateText}</span>`;
        } else if (index > 0) {
            // Other dates are grey
            content = `<span style="color: grey;">${dateText}</span>`;
        } else {
            // First date but not today - show in white
            content = dateText;
        }
            
        html += `<tr><td>${content}</td></tr>`;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Initialize on page load
$(document).ready(function() {
    fetchPostalDelivery();

});
