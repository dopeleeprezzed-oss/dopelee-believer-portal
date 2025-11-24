// CONFIG
const SPREADSHEET_ID = '1vhv6D32H97WQHgvtC6Jh_6CTb4u1txKk98mjKDCKW_A';
const API_KEY = 'AIzaSyBeteoBZZlHtydPRd-CqBQ1E0edQPXxtEE';
const SHEET_NAME = 'BRAIN';
const REVIEW_LINK = 'https://tr.ee/3OJ5e4';
const DAYS_UNTIL_REVIEW = 5;

let allOrders = [];
let currentEmail = '';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email');
  
  if (emailParam) {
    document.getElementById('emailInput').value = emailParam;
    window.onload = () => {
  const emailInput = document.getElementById('emailInput');
  if (emailInput.value.trim() !== '') {
    document.getElementById('lookupForm').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
  }
};
 
  document.getElementById('lookupForm').addEventListener('submit', handleLookup);
});

async function handleLookup(e) {
  e.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  if (!email) {
    showError('Please enter your email address.');
    return;
  }
  currentEmail = email;
  showLoading();
  try {
    await loadOrders(email);
  } catch (error) {
    console.error('Error loading orders:', error);
    showError('Unable to load orders. Please try again later.');
  }
}

async function loadOrders(email) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:AI?key=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      throw new Error(`API returned status ${response.status}`);
    }
    const data = await response.json();
    console.log('API Response received');
    if (!data.values || data.values.length < 2) {
      throw new Error('No data in sheet');
    }
    const customerOrders = data.values.slice(1).filter(row => {
      const rowEmail = row[5];
      return rowEmail && rowEmail.toLowerCase().trim() === email.toLowerCase().trim();
    });
    console.log('Found orders:', customerOrders.length);
    if (customerOrders.length === 0) {
      showError(`No orders found for ${email}. Please check your email address and try again.`);
      return;
    }
    allOrders = customerOrders;
    displayOrderList();
  } catch (error) {
    console.error('Error loading orders:', error);
    showError(`Unable to load orders. Please try again or contact support.`);
  }
}

function displayOrderList() {
  const greeting = document.getElementById('customerGreeting');
  greeting.textContent = `Welcome back! You have ${allOrders.length} order${allOrders.length > 1 ? 's' : ''}.`;
  const container = document.getElementById('ordersContainer');
  container.innerHTML = '';
  allOrders.forEach((order, index) => {
    const card = createOrderCard(order, index);
    container.appendChild(card);
  });
  showSection('orderList');
}

function createOrderCard(order, index) {
  const orderId = order[0] || 'N/A';
  const honoree = order[8] || 'N/A';
  const product = order[11] || 'N/A';
  const status = order[25] || 'Unknown';
  const submittedDate = order[18] ? formatDate(new Date(order[18])) : 'N/A';
  const card = document.createElement('div');
  card.className = 'order-card';
  card.onclick = () => showOrderDetails(index);
  const statusClass = getStatusClass(status);
  card.innerHTML = `
    <div class="order-header">
      <div class="order-id">Order #${orderId}</div>
      <div class="status-badge ${statusClass}">${status}</div>
    </div>
    <div class="order-info">
      <strong>Honoring:</strong> ${honoree}<br>
      <strong>Product:</strong> ${product}<br>
      <strong>Ordered:</strong> ${submittedDate}
    </div>
  `;
  return card;
}

function showOrderDetails(index) {
  const order = allOrders[index];
  const content = document.getElementById('detailsContent');
  const orderId = order[0] || 'N/A';
  const honoree = order[8] || 'N/A';
  const sunrise = order[9] ? formatDate(new Date(order[9])) : 'N/A';
  const sunset = order[10] ? formatDate(new Date(order[10])) : 'N/A';
  const product = order[11] || 'N/A';
  const template = order[12] || 'N/A';
  const personalization = order[13] || '';
  const orderTotal = order[15] ? `$${parseFloat(order[15]).toFixed(2)}` : 'N/A';
  const photoUrl = order[16] || '';
  const submittedDate = order[18] ? new Date(order[18]) : null;
  const dueDate = order[21] ? new Date(order[21]) : null;
  const shippedDate = order[22] ? new Date(order[22]) : null;
  const trackingNumber = order[23] || '';
  const status = order[25] || 'Unknown';
  const deliveredDate = order[27] ? new Date(order[27]) : null;
  const statusClass = getStatusClass(status);
  const timeline = createTimeline(status, submittedDate, shippedDate, deliveredDate);
  const photoGallery = photoUrl ? createPhotoGallery(photoUrl) : '';
  const trackingSection = trackingNumber ? `
    <div class="detail-card">
      <h3>📦 Tracking Information</h3>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <a href="https://www.ups.com/track?tracknum=${trackingNumber}" target="_blank" class="tracking-link">📍 Track Package</a>
    </div>
  ` : '';
  content.innerHTML = `
    <div class="detail-card">
      <div class="detail-header">
        <h2>Order #${orderId}</h2>
        <div class="status-badge ${statusClass}">${status}</div>
      </div>
      <div class="order-info">
        <strong>Honoring:</strong> ${honoree}<br>
        <strong>Sunrise:</strong> ${sunrise}<br>
        <strong>Sunset:</strong> ${sunset}<br>
        <strong>Product:</strong> ${product}<br>
        <strong>Template:</strong> ${template}<br>
        ${personalization ? `<strong>Personalization:</strong> ${personalization}<br>` : ''}
        <strong>Order Total:</strong> ${orderTotal}<br>
        <strong>Ordered:</strong> ${submittedDate ? formatDate(submittedDate) : 'N/A'}<br>
        ${dueDate ? `<strong>Expected Delivery:</strong> ${formatDate(dueDate)}<br>` : ''}
      </div>
    </div>
    ${timeline}
    ${photoGallery}
    ${trackingSection}
    <div class="action-buttons">
      <button onclick="contactUs('${orderId}')" class="btn-secondary">📧 Contact Us</button>
      <button onclick="downloadInvoice(${index})" class="btn-secondary">📄 Download Invoice</button>
    </div>
  `;
  showSection('orderDetails');
}

function createTimeline(status, submittedDate, shippedDate, deliveredDate) {
  const stages = [
    { name: 'Order Confirmed', icon: '✓', complete: true, date: submittedDate },
    { name: 'Payment Received', icon: '✓', complete: true, date: submittedDate },
    { name: 'Design Submitted', icon: '✓', complete: true, date: submittedDate },
    { name: 'In Production', icon: '🔨', complete: status !== 'Order Confirmed', current: status === 'In Production' },
    { name: 'Shipped', icon: '📦', complete: status === 'Shipped' || status === 'Delivered', current: status === 'Shipped', date: shippedDate },
    { name: 'Delivered', icon: '✓', complete: status === 'Delivered', date: deliveredDate }
  ];
  const showReview = status === 'Delivered' && deliveredDate && daysSince(deliveredDate) >= DAYS_UNTIL_REVIEW;
  if (showReview) {
    stages.push({ name: 'Leave a Review', icon: '⭐', review: true });
  }
  let html = '<div class="detail-card"><h3>📍 Order Journey</h3><div class="timeline">';
  stages.forEach(stage => {
    let stageClass = 'stage-pending';
    if (stage.complete) stageClass = 'stage-complete';
    else if (stage.current) stageClass = 'stage-current';
    else if (stage.review) stageClass = 'stage-review';
    html += `
      <div class="timeline-stage">
        <div class="stage-icon ${stageClass}">${stage.icon}</div>
        <div class="stage-content">
          <div class="stage-name">${stage.name}</div>
          ${stage.date ? `<div class="stage-date">${formatDate(stage.date)}</div>` : ''}
          ${stage.review ? `<a href="${REVIEW_LINK}" target="_blank" class="review-button">⭐ Review Now</a>` : ''}
        </div>
      </div>
    `;
  });
  html += '</div></div>';
  return html;
}

function createPhotoGallery(photoUrl) {
  let imageUrl = photoUrl;
  if (photoUrl.includes('drive.google.com')) {
    let driveId = null;
    const match1 = photoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) driveId = match1[1];
    const match2 = photoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) driveId = match2[1];
    if (driveId) {
      imageUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
    }
  }
  return `
    <div class="detail-card photo-gallery">
      <h3>📸 Your Photo</h3>
      <div class="photo-container">
        <div class="photo-item">
          <img src="${imageUrl}" alt="Uploaded photo" onerror="this.style.display='none'">
        </div>
      </div>
    </div>
  `;
}

function downloadInvoice(index) {
  const order = allOrders[index];
  const orderId = order[0];
  const customerEmail = order[5];
  const honoree = order[8];
  const product = order[11];
  const template = order[12];
  const orderTotal = order[15];
  const submittedDate = order[18] ? formatDate(new Date(order[18])) : 'N/A';
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Invoice</title><style>body{font-family:Arial;max-width:800px;margin:40px auto;padding:20px}.header{text-align:center;border-bottom:3px solid #0a95a8;padding-bottom:20px;margin-bottom:30px}.header h1{margin:0;color:#0a95a8}table{width:100%;border-collapse:collapse}td{padding:8px;border-bottom:1px solid #ddd}td:first-child{font-weight:bold;width:200px}.total{text-align:right;font-size:1.5rem;font-weight:bold;margin-top:30px;color:#0a95a8}</style></head><body><div class="header"><h1>🖤 DOPELEE PREZZED BY S™</h1><p>Luxury keepsakes. Timelessly crafted.</p></div><h2>INVOICE</h2><table><tr><td>Order:</td><td>${orderId}</td></tr><tr><td>Date:</td><td>${submittedDate}</td></tr><tr><td>Email:</td><td>${customerEmail}</td></tr><tr><td>Honoring:</td><td>${honoree}</td></tr><tr><td>Product:</td><td>${product}</td></tr><tr><td>Template:</td><td>${template}</td></tr><tr><td>Status:</td><td style="color:green;font-weight:bold">Paid ✓</td></tr></table><div class="total">Total: $${parseFloat(orderTotal).toFixed(2)}</div></body></html>`);
  w.document.close();
}

function contactUs(orderId) {
  window.location.href = `mailto:dopeleeprezzed@gmail.com?subject=${encodeURIComponent('Order ' + orderId + ' - Question')}`;
}

function getStatusClass(status) {
  const m = {'Order Confirmed':'status-confirmed','In Production':'status-production','Shipped':'status-shipped','Delivered':'status-delivered'};
  return m[status] || 'status-confirmed';
}

function formatDate(date) {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'});
}

function daysSince(date) {
  return Math.floor((new Date() - new Date(date)) / 86400000);
}

function showSection(id) {
  ['loading','lookupSection','orderList','orderDetails','error'].forEach(s => {
    document.getElementById(s).style.display = s === id ? 'block' : 'none';
  });
}

function showLoading() { showSection('loading'); }
function showLookup() { showSection('lookupSection'); }
function showOrderList() { displayOrderList(); }
function showError(msg) {
  document.getElementById('errorMessage').textContent = msg;
  showSection('error');
}

