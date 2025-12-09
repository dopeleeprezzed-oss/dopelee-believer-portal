// CONFIG
const SPREADSHEET_ID = '1vhv6D32H97WQHgvtC6Jh_6CTb4u1txKk98mjKDCKW_A';
const API_KEY = 'AIzaSyBeteoBZZlHtydPRd-CqBQ1E0edQPXxtEE';

// ALL 4 SHEETS
const SHEETS = {
  KEEPSAKES: 'KEEPSAKES',
  VIP: 'VIP_PROJECTS',
  PHOTOBOOKS: 'PHOTOBOOKS',
  PARTNERSHIPS: 'PARTNERSHIPS'
};

const REVIEW_LINK = 'https://tr.ee/3OJ5e4';
const DAYS_UNTIL_REVIEW = 5;
const SMARTFORM_URL = 'https://dopeleeprezzed-oss.github.io/dopelee-form/';

// Global data
let allOrders = [];
let currentEmail = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check for order ID in URL (direct portal link)
  const urlParams = new URLSearchParams(window.location.search);
  const orderParam = urlParams.get('order');
  const emailParam = urlParams.get('email');
  
  if (orderParam) {
    // Direct link to specific order
    loadOrderByID(orderParam);
  } else if (emailParam) {
    // Email provided in URL
    document.getElementById('emailInput').value = emailParam;
    setTimeout(() => {
      document.getElementById('lookupForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }, 100);
  }
  
  // Form submission
  document.getElementById('lookupForm').addEventListener('submit', handleLookup);
});

/**
 * Handle email lookup
 */
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

/**
 * Load orders from ALL 4 SHEETS
 */
async function loadOrders(email) {
  showLoading();
  
  try {
    // Fetch all 4 sheets in parallel
    const fetchPromises = Object.values(SHEETS).map(sheetName => 
      fetchSheetData(sheetName)
    );
    
    const allSheetData = await Promise.all(fetchPromises);
    
    // Parse orders from each sheet
    let allCustomerOrders = [];
    
    // KEEPSAKES
    if (allSheetData[0]) {
      const keepsakeOrders = parseKeepsakeOrders(allSheetData[0], email);
      allCustomerOrders = allCustomerOrders.concat(keepsakeOrders);
    }
    
    // VIP
    if (allSheetData[1]) {
      const vipOrders = parseVIPOrders(allSheetData[1], email);
      allCustomerOrders = allCustomerOrders.concat(vipOrders);
    }
    
    // PHOTOBOOKS
    if (allSheetData[2]) {
      const photobookOrders = parsePhotobookOrders(allSheetData[2], email);
      allCustomerOrders = allCustomerOrders.concat(photobookOrders);
    }
    
    // PARTNERSHIPS
    if (allSheetData[3]) {
      const partnershipOrders = parsePartnershipOrders(allSheetData[3], email);
      allCustomerOrders = allCustomerOrders.concat(partnershipOrders);
    }
    
    console.log('Total orders found:', allCustomerOrders.length);
    
    if (allCustomerOrders.length === 0) {
      showError(`No orders found for ${email}. Please check your email address and try again.`);
      return;
    }
    
    // Sort by date (newest first)
    allCustomerOrders.sort((a, b) => {
      const dateA = a.rawData[7] ? new Date(a.rawData[7]) : new Date(0);
      const dateB = b.rawData[7] ? new Date(b.rawData[7]) : new Date(0);
      return dateB - dateA;
    });
    
    allOrders = allCustomerOrders;
    displayOrderList();
    
  } catch (error) {
    console.error('Error loading orders:', error);
    showError(`Unable to load orders. Error: ${error.message}. Please try again or contact support.`);
  }
}

/**
 * Fetch data from a specific sheet
 */
async function fetchSheetData(sheetName) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}!A:AZ?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Error fetching ${sheetName}:`, response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.values || data.values.length < 2) {
      console.log(`No data in ${sheetName}`);
      return null;
    }
    
    return data.values;
    
  } catch (error) {
    console.error(`Error fetching ${sheetName}:`, error);
    return null;
  }
}

/**
 * Parse KEEPSAKES orders
 */
function parseKeepsakeOrders(sheetData, email) {
  const orders = [];
  
  sheetData.slice(1).forEach(row => {
    const rowEmail = row[2]; // Column C
    if (rowEmail && rowEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
      orders.push({
        type: 'keepsake',
        rawData: row
      });
    }
  });
  
  console.log(`Found ${orders.length} keepsake orders`);
  return orders;
}

/**
 * Parse VIP orders
 */
function parseVIPOrders(sheetData, email) {
  const orders = [];
  
  sheetData.slice(1).forEach(row => {
    const rowEmail = row[2]; // Column C
    if (rowEmail && rowEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
      orders.push({
        type: 'vip',
        rawData: row
      });
    }
  });
  
  console.log(`Found ${orders.length} VIP orders`);
  return orders;
}

/**
 * Parse PHOTOBOOK orders
 */
function parsePhotobookOrders(sheetData, email) {
  const orders = [];
  
  sheetData.slice(1).forEach(row => {
    const rowEmail = row[2]; // Column C
    if (rowEmail && rowEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
      orders.push({
        type: 'photobook',
        rawData: row
      });
    }
  });
  
  console.log(`Found ${orders.length} photobook orders`);
  return orders;
}

/**
 * Parse PARTNERSHIP applications
 */
function parsePartnershipOrders(sheetData, email) {
  const orders = [];
  
  sheetData.slice(1).forEach(row => {
    const rowEmail = row[4]; // Column E - Contact_Email
    if (rowEmail && rowEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
      orders.push({
        type: 'partnership',
        rawData: row
      });
    }
  });
  
  console.log(`Found ${orders.length} partnership applications`);
  return orders;
}

/**
 * Load single order by ID (for direct portal links) - CHECKS ALL 4 SHEETS
 */
async function loadOrderByID(orderId) {
  showLoading();
  
  try {
    // Fetch all 4 sheets
    const fetchPromises = Object.values(SHEETS).map(sheetName => 
      fetchSheetData(sheetName)
    );
    
    const allSheetData = await Promise.all(fetchPromises);
    
    // Search each sheet for the order ID
    let foundOrder = null;
    let foundType = null;
    
    // Check KEEPSAKES (Column A)
    if (allSheetData[0]) {
      const orderRow = allSheetData[0].slice(1).find(row => row[0] === orderId);
      if (orderRow) {
        foundOrder = orderRow;
        foundType = 'keepsake';
      }
    }
    
    // Check VIP (Column A)
    if (!foundOrder && allSheetData[1]) {
      const orderRow = allSheetData[1].slice(1).find(row => row[0] === orderId);
      if (orderRow) {
        foundOrder = orderRow;
        foundType = 'vip';
      }
    }
    
    // Check PHOTOBOOKS (Column A)
    if (!foundOrder && allSheetData[2]) {
      const orderRow = allSheetData[2].slice(1).find(row => row[0] === orderId);
      if (orderRow) {
        foundOrder = orderRow;
        foundType = 'photobook';
      }
    }
    
    // Check PARTNERSHIPS (Column A - Partner_ID)
    if (!foundOrder && allSheetData[3]) {
      const orderRow = allSheetData[3].slice(1).find(row => row[0] === orderId);
      if (orderRow) {
        foundOrder = orderRow;
        foundType = 'partnership';
      }
    }
    
    if (!foundOrder) {
      showError(`Order ${orderId} not found. Please check your link or search by email.`);
      return;
    }
    
    allOrders = [{ type: foundType, rawData: foundOrder }];
    currentEmail = foundOrder[2]; // Get email from order (Column C for most sheets)
    showOrderDetails(0);
    
  } catch (error) {
    console.error('Error loading order:', error);
    showError(`Unable to load order. Please try again or contact support.`);
  }
}

/**
 * Display list of orders
 */
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

/**
 * Create order card - HANDLES ALL 4 TYPES
 */
function createOrderCard(order, index) {
  const row = order.rawData;
  const type = order.type;
  
  let orderId, description, product, status, submittedDate;
  
  if (type === 'keepsake') {
    orderId = row[0] || 'N/A'; // A - Order_ID
    description = `Honoring: ${row[11] || 'N/A'}`; // L - Honored_Name
    product = row[14] || 'Keepsake'; // O - Product_Type
    status = row[6] || 'Unknown'; // G - Status
    submittedDate = row[7] ? formatDate(new Date(row[7])) : 'N/A'; // H
  } else if (type === 'vip') {
    orderId = row[0] || 'N/A';
    description = `VIP: ${row[11] || 'N/A'}`; // L - VIP_Business_Name
    product = `${row[13] || 'N/A'} gifts`; // N - Estimated_Quantity
    status = row[6] || 'Unknown';
    submittedDate = row[7] ? formatDate(new Date(row[7])) : 'N/A';
  } else if (type === 'photobook') {
    orderId = row[0] || 'N/A';
    description = `Photo Book: ${row[12] || 'N/A'}`; // M - Book_Celebration_Type
    product = row[11] || 'Photo Book'; // L - Photo_Book_Pages
    status = row[6] || 'Unknown';
    submittedDate = row[7] ? formatDate(new Date(row[7])) : 'N/A';
  } else if (type === 'partnership') {
    orderId = row[0] || 'N/A'; // A - Partner_ID
    description = `Partnership: ${row[5] || 'N/A'}`; // F - Business_Name
    product = row[11] || 'Partnership'; // L - Venue_Type
    status = row[10] || 'Unknown'; // K - Status
    submittedDate = row[1] ? formatDate(new Date(row[1])) : 'N/A'; // B - Application_Date
  }
  
  const card = document.createElement('div');
  card.className = 'order-card';
  card.onclick = () => showOrderDetails(index);
  
  const statusClass = getStatusClass(status);
  
  // Add type badge
  const typeBadge = `<span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 8px;">${type.toUpperCase()}</span>`;
  
  card.innerHTML = `
    <div class="order-header">
      <div class="order-id">${typeBadge}Order #${orderId}</div>
      <div class="status-badge ${statusClass}">${status}</div>
    </div>
    <div class="order-info">
      <strong>${description}</strong><br>
      <strong>Product:</strong> ${product}<br>
      <strong>Ordered:</strong> ${submittedDate}
    </div>
  `;
  
  return card;
}

/**
 * Show order details - HANDLES ALL 4 TYPES
 */
function showOrderDetails(index) {
  const order = allOrders[index];
  const row = order.rawData;
  const type = order.type;
  const content = document.getElementById('detailsContent');
  
  let html = '';
  
  // Route to type-specific detail builder
  if (type === 'keepsake') {
    html = buildKeepsakeDetails(row);
  } else if (type === 'vip') {
    html = buildVIPDetails(row);
  } else if (type === 'photobook') {
    html = buildPhotobookDetails(row);
  } else if (type === 'partnership') {
    html = buildPartnershipDetails(row);
  }
  
  content.innerHTML = html;
  showSection('orderDetails');
}

/**
 * Build KEEPSAKE details
 */
function buildKeepsakeDetails(row) {
  const orderId = row[0] || 'N/A';
  const customerName = row[1] || 'N/A';
  const firstName = customerName.split(' ')[0]; // Get first name
  const customerEmail = row[2] || '';
  const status = row[6] || 'Unknown';
  const submittedDate = row[7] ? new Date(row[7]) : null;
  const paymentDate = row[8] ? new Date(row[8]) : null;
  const honoree = row[11] || 'N/A';
  const dates = row[12] || '';
  const product = row[14] || 'N/A';
  const template = row[15] || 'N/A';
  const customWording = row[17] || '';
  const photoUrl = row[20] || '';
  const orderTotal = row[37] ? `$${parseFloat(row[37]).toFixed(2)}` : 'N/A';
  
  const proofSentDate = row[21] ? new Date(row[21]) : null;
  const productionStartDate = row[23] ? new Date(row[23]) : null;
  const shippedDate = row[26] ? new Date(row[26]) : null;
  const trackingNumber = row[27] || '';
  const deliveredDate = row[28] ? new Date(row[28]) : null;
  
  const statusClass = getStatusClass(status);
  const nextAction = determineKeepsakeNextAction(row);
  const timeline = createTimeline(status, submittedDate, proofSentDate, productionStartDate, shippedDate, deliveredDate);
  const photoGallery = photoUrl ? createPhotoGallery(photoUrl) : '';
  const trackingSection = trackingNumber ? `
    <div class="detail-card">
      <h3>📦 Tracking Information</h3>
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <a href="https://www.ups.com/track?tracknum=${trackingNumber}" target="_blank" class="tracking-link">
        📍 Track Package
      </a>
    </div>
  ` : '';
  
  return `
    <div class="detail-card">
      <div class="detail-header">
        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Hi ${firstName}, your Legacy Journii begins here.</h2>
        <div style="margin-bottom: 1rem;">
          <span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 8px;">KEEPSAKE</span>
          <span style="font-size: 0.9rem; color: var(--text-muted);">Order #${orderId}</span>
        </div>
        <div class="status-badge ${statusClass}">${status}</div>
      </div>
      
      <div class="order-info">
        <strong>Honoring:</strong> ${honoree}<br>
        ${dates ? `<strong>Dates:</strong> ${dates}<br>` : ''}
        <strong>Product:</strong> ${product}<br>
        <strong>Template:</strong> ${template}<br>
        ${customWording ? `<strong>Personalization:</strong> ${customWording}<br>` : ''}
        <strong>Order Total:</strong> ${orderTotal}<br>
        <strong>Ordered:</strong> ${submittedDate ? formatDate(submittedDate) : 'N/A'}<br>
      </div>
    </div>
    
    ${nextAction}
    ${timeline}
    ${photoGallery}
    ${trackingSection}
    
    <div class="action-buttons">
      <button onclick="contactUs('${orderId}')" class="btn-secondary">📧 Contact Us</button>
    </div>
  `;
}

/**
 * Build VIP details
 */
function buildVIPDetails(row) {
  const orderId = row[0] || 'N/A';
  const customerName = row[1] || 'N/A';
  const firstName = customerName.split(' ')[0];
  const status = row[6] || 'Unknown';
  const submittedDate = row[7] ? new Date(row[7]) : null;
  const businessName = row[11] || 'N/A';
  const giftsFor = row[12] || 'N/A';
  const quantity = row[13] || 'N/A';
  const deliveryDate = row[14] || 'N/A';
  const budget = row[15] || 'N/A';
  const orderTotal = row[46] ? `$${parseFloat(row[46]).toFixed(2)}` : 'TBD';
  
  const statusClass = getStatusClass(status);
  const nextAction = determineVIPNextAction(row);
  
  return `
    <div class="detail-card">
      <div class="detail-header">
        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Hi ${firstName}, your VIP Journii begins here.</h2>
        <div style="margin-bottom: 1rem;">
          <span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 8px;">VIP</span>
          <span style="font-size: 0.9rem; color: var(--text-muted);">Order #${orderId}</span>
        </div>
        <div class="status-badge ${statusClass}">${status}</div>
      </div>
      
      <div class="order-info">
        <strong>Business:</strong> ${businessName}<br>
        <strong>Gifts For:</strong> ${giftsFor}<br>
        <strong>Quantity:</strong> ${quantity}<br>
        <strong>Requested Delivery:</strong> ${deliveryDate}<br>
        <strong>Budget Range:</strong> ${budget}<br>
        <strong>Order Total:</strong> ${orderTotal}<br>
        <strong>Submitted:</strong> ${submittedDate ? formatDate(submittedDate) : 'N/A'}<br>
      </div>
    </div>
    
    ${nextAction}
    
    <div class="action-buttons">
      <button onclick="contactUs('${orderId}')" class="btn-secondary">📧 Contact Us</button>
    </div>
  `;
}

/**
 * Build PHOTOBOOK details
 */
function buildPhotobookDetails(row) {
  const orderId = row[0] || 'N/A';
  const customerName = row[1] || 'N/A';
  const firstName = customerName.split(' ')[0];
  const status = row[6] || 'Unknown';
  const submittedDate = row[7] ? new Date(row[7]) : null;
  const pages = row[11] || 'N/A';
  const celebration = row[12] || 'N/A';
  const honorText = row[14] || '';
  const orderTotal = row[43] ? `$${parseFloat(row[43]).toFixed(2)}` : 'N/A';
  
  const statusClass = getStatusClass(status);
  const nextAction = determinePhotobookNextAction(row);
  
  return `
    <div class="detail-card">
      <div class="detail-header">
        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Hi ${firstName}, your Photo Book Journii begins here.</h2>
        <div style="margin-bottom: 1rem;">
          <span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 8px;">PHOTO BOOK</span>
          <span style="font-size: 0.9rem; color: var(--text-muted);">Order #${orderId}</span>
        </div>
        <div class="status-badge ${statusClass}">${status}</div>
      </div>
      
      <div class="order-info">
        <strong>Pages:</strong> ${pages}<br>
        <strong>Celebration Type:</strong> ${celebration}<br>
        ${honorText ? `<strong>About:</strong> ${honorText}<br>` : ''}
        <strong>Order Total:</strong> ${orderTotal}<br>
        <strong>Ordered:</strong> ${submittedDate ? formatDate(submittedDate) : 'N/A'}<br>
      </div>
    </div>
    
    ${nextAction}
    
    <div class="action-buttons">
      <button onclick="contactUs('${orderId}')" class="btn-secondary">📧 Contact Us</button>
    </div>
  `;
}

/**
 * Build PARTNERSHIP details
 */
function buildPartnershipDetails(row) {
  const partnerId = row[0] || 'N/A';
  const applicationDate = row[1] ? new Date(row[1]) : null;
  const contactName = row[2] || 'N/A';
  const firstName = contactName.split(' ')[0];
  const businessName = row[5] || 'N/A';
  const venueType = row[11] || 'N/A';
  const status = row[10] || 'Unknown';
  const commissionRate = row[26] || '10%';
  const commissionEarned = row[27] ? `$${parseFloat(row[27]).toFixed(2)}` : '$0.00';
  const ordersCount = row[29] || '0';
  
  const statusClass = getStatusClass(status);
  const nextAction = determinePartnershipNextAction(row);
  
  return `
    <div class="detail-card">
      <div class="detail-header">
        <h2 style="font-size: 1.8rem; margin-bottom: 0.5rem;">Hi ${firstName}, your Partnership Journii begins here.</h2>
        <div style="margin-bottom: 1rem;">
          <span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 8px;">PARTNERSHIP</span>
          <span style="font-size: 0.9rem; color: var(--text-muted);">${businessName}</span>
        </div>
        <div class="status-badge ${statusClass}">${status}</div>
      </div>
      
      <div class="order-info">
        <strong>Partner ID:</strong> ${partnerId}<br>
        <strong>Venue Type:</strong> ${venueType}<br>
        <strong>Commission Rate:</strong> ${commissionRate}<br>
        <strong>Total Earned:</strong> ${commissionEarned}<br>
        <strong>Orders Generated:</strong> ${ordersCount}<br>
        <strong>Applied:</strong> ${applicationDate ? formatDate(applicationDate) : 'N/A'}<br>
      </div>
    </div>
    
    ${nextAction}
    
    <div class="action-buttons">
      <button onclick="contactUs('${partnerId}')" class="btn-secondary">📧 Contact Us</button>
    </div>
  `;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔥 DETERMINE NEXT ACTIONS FOR EACH TYPE
 * ═══════════════════════════════════════════════════════════════
 */

function determineKeepsakeNextAction(row) {
  const status = row[6] || '';
  const formComplete = row[41] || false; // AP - Form_Complete (column 42, index 41)
  const orderId = row[0] || '';
  const customerEmail = row[2] || '';
  const customerName = row[1] || '';
  const orderNumber = row[4] || orderId;
  
  if (status === 'Payment Received' && !formComplete) {
    const formLink = `${SMARTFORM_URL}?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}&projectType=keepsake`;
    
    return `
      <div class="detail-card" style="background: linear-gradient(135deg, rgba(233, 255, 96, 0.1), rgba(10, 149, 168, 0.1)); border: 2px solid #e9ff60;">
        <h3 style="color: #e9ff60; margin-bottom: 1rem;">📝 Next Step: Complete Your Design Details</h3>
        <p style="color: #b8bac0; margin-bottom: 1.5rem;">
          We've received your payment! Now it's time to personalize your keepsake. 
          Tell us about the design, upload your photo, and add custom wording.
        </p>
        <a href="${formLink}" target="_blank" class="btn-primary" style="display: inline-block; text-decoration: none; padding: 1rem 2rem; background: linear-gradient(135deg, #e9ff60, #0ff0b8); color: #000; border-radius: 12px; font-weight: 700; text-align: center;">
          ✨ Complete Personalization Now
        </a>
      </div>
    `;
  }
  
  if (status === 'Form Received' || (formComplete && status === 'Payment Received')) {
    return `
      <div class="detail-card" style="background: rgba(15, 240, 184, 0.05); border: 2px solid #0ff0b8;">
        <h3 style="color: #0ff0b8; margin-bottom: 1rem;">👀 Your Design is Being Reviewed</h3>
        <p style="color: #b8bac0;">
          We're reviewing your design details and will begin production shortly. 
          We'll update this portal as soon as we start creating your keepsake!
        </p>
      </div>
    `;
  }
  
  if (status === 'In Production') {
    return `
      <div class="detail-card" style="background: rgba(52, 97, 250, 0.05); border: 2px solid #3461fa;">
        <h3 style="color: #3461fa; margin-bottom: 1rem;">🔨 Your Keepsake is Being Crafted</h3>
        <p style="color: #b8bac0;">
          Our artisans are carefully creating your custom piece. 
          We'll notify you as soon as it ships!
        </p>
      </div>
    `;
  }
  
  if (status === 'Shipped') {
    return `
      <div class="detail-card" style="background: rgba(253, 38, 253, 0.05); border: 2px solid #fd26fd;">
        <h3 style="color: #fd26fd; margin-bottom: 1rem;">📦 Your Order is On The Way!</h3>
        <p style="color: #b8bac0;">
          Your keepsake has shipped! Check the tracking information below to see its journey to you.
        </p>
      </div>
    `;
  }
  
  if (status === 'Delivered') {
    return `
      <div class="detail-card" style="background: rgba(233, 255, 96, 0.05); border: 2px solid #e9ff60;">
        <h3 style="color: #e9ff60; margin-bottom: 1rem;">✨ Delivered!</h3>
        <p style="color: #b8bac0; margin-bottom: 1rem;">
          Your keepsake has been delivered. We hope it brings comfort and joy.
        </p>
        <a href="${REVIEW_LINK}" target="_blank" class="review-button">
          ⭐ Leave a Review
        </a>
      </div>
    `;
  }
  
  return '';
}

function determineVIPNextAction(row) {
  const status = row[6] || '';
  const orderId = row[0] || '';
  const customerEmail = row[2] || '';
  const customerName = row[1] || '';
  const orderNumber = row[4] || orderId;
  
  // If they haven't filled the form yet
  if (status === 'New' || status === 'Payment Received') {
    const vipFormLink = `${SMARTFORM_URL}?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}&projectType=vip`;
    
    return `
      <div class="detail-card" style="background: linear-gradient(135deg, rgba(233, 255, 96, 0.1), rgba(10, 149, 168, 0.1)); border: 2px solid #e9ff60;">
        <h3 style="color: #e9ff60; margin-bottom: 1rem;">📝 Next Step: Tell Us About Your VIP Project</h3>
        <p style="color: #b8bac0; margin-bottom: 1.5rem;">
          Share your vision! Tell us about your business, what you're celebrating, and your gift needs.
        </p>
        <a href="${vipFormLink}" target="_blank" class="btn-primary" style="display: inline-block; text-decoration: none; padding: 1rem 2rem; background: linear-gradient(135deg, #e9ff60, #0ff0b8); color: #000; border-radius: 12px; font-weight: 700; text-align: center;">
          💼 Complete VIP Project Details
        </a>
      </div>
    `;
  }
  
  if (status === 'Form Received' || status === 'Awaiting Quote') {
    return `
      <div class="detail-card" style="background: rgba(233, 255, 96, 0.1); border: 2px solid #e9ff60;">
        <h3 style="color: #e9ff60; margin-bottom: 1rem;">✍️ Preparing Your Custom Quote</h3>
        <p style="color: #b8bac0;">
          We're creating a custom proposal for your VIP project. 
          We'll send you mock-ups and pricing within 2-3 business days.
        </p>
      </div>
    `;
  }
  
  if (status === 'Quote Sent' || status === 'Awaiting Approval') {
    return `
      <div class="detail-card" style="background: rgba(15, 240, 184, 0.05); border: 2px solid #0ff0b8;">
        <h3 style="color: #0ff0b8; margin-bottom: 1rem;">👀 Quote Sent - Awaiting Your Approval</h3>
        <p style="color: #b8bac0;">
          Check your email for mock-ups and pricing. Reply to approve and we'll send your invoice!
        </p>
      </div>
    `;
  }
  
  if (status === 'In Production') {
    return `
      <div class="detail-card" style="background: rgba(52, 97, 250, 0.05); border: 2px solid #3461fa;">
        <h3 style="color: #3461fa; margin-bottom: 1rem;">🔨 Your VIP Order is in Production</h3>
        <p style="color: #b8bac0;">
          We're creating your custom gifts. We'll update you with progress!
        </p>
      </div>
    `;
  }
  
  return '';
}

function determinePhotobookNextAction(row) {
  const status = row[6] || '';
  const formComplete = row[41] || false; // AP - Form_Complete (column 42, index 41)
  const orderId = row[0] || '';
  const customerEmail = row[2] || '';
  const customerName = row[1] || '';
  const orderNumber = row[4] || orderId;
  
  // STATUS: Payment Received → Need personalization + photo upload
  if (status === 'Payment Received' && !formComplete) {
    const formLink = `${SMARTFORM_URL}?orderNumber=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}&projectType=photobook`;
    
    return `
      <div class="detail-card" style="background: linear-gradient(135deg, rgba(233, 255, 96, 0.1), rgba(10, 149, 168, 0.1)); border: 2px solid #e9ff60;">
        <h3 style="color: #e9ff60; margin-bottom: 1rem;">📝 Next Step: Upload Photos & Complete Details</h3>
        <p style="color: #b8bac0; margin-bottom: 1.5rem;">
          We've received your payment! Now it's time to upload your photos and tell us about your photo book celebration.
        </p>
        <a href="${formLink}" target="_blank" class="btn-primary" style="display: inline-block; text-decoration: none; padding: 1rem 2rem; background: linear-gradient(135deg, #e9ff60, #0ff0b8); color: #000; border-radius: 12px; font-weight: 700; text-align: center;">
          📸 Upload Photos & Complete Form
        </a>
      </div>
    `;
  }
  
  if (status === 'Form Received' || status === 'Photos Received') {
    return `
      <div class="detail-card" style="background: rgba(15, 240, 184, 0.05); border: 2px solid #0ff0b8;">
        <h3 style="color: #0ff0b8; margin-bottom: 1rem;">🎨 Designing Your Photo Book</h3>
        <p style="color: #b8bac0;">
          We're curating your photos into a beautiful layout. 
          We'll send you a design proof for approval within 5-7 business days.
        </p>
      </div>
    `;
  }
  
  if (status === 'Design Sent' || status === 'Awaiting Approval') {
    return `
      <div class="detail-card" style="background: rgba(253, 38, 253, 0.05); border: 2px solid #fd26fd;">
        <h3 style="color: #fd26fd; margin-bottom: 1rem;">👀 Design Proof Sent - Awaiting Your Approval</h3>
        <p style="color: #b8bac0;">
          Check your email for the photo book design. Let us know if you'd like any changes!
        </p>
      </div>
    `;
  }
  
  if (status === 'In Production') {
    return `
      <div class="detail-card" style="background: rgba(52, 97, 250, 0.05); border: 2px solid #3461fa;">
        <h3 style="color: #3461fa; margin-bottom: 1rem;">📖 Printing Your Photo Book</h3>
        <p style="color: #b8bac0;">
          Your photo book is being professionally printed and bound!
        </p>
      </div>
    `;
  }
  
  if (status === 'Shipped') {
    return `
      <div class="detail-card" style="background: rgba(253, 38, 253, 0.05); border: 2px solid #fd26fd;">
        <h3 style="color: #fd26fd; margin-bottom: 1rem;">📦 Your Photo Book is On The Way!</h3>
        <p style="color: #b8bac0;">
          Your photo book has shipped! Check the tracking information below.
        </p>
      </div>
    `;
  }
  
  if (status === 'Delivered') {
    return `
      <div class="detail-card" style="background: rgba(233, 255, 96, 0.05); border: 2px solid #e9ff60;">
        <h3 style="color: #e9ff60; margin-bottom: 1rem;">✨ Delivered!</h3>
        <p style="color: #b8bac0; margin-bottom: 1rem;">
          Your photo book has been delivered. We hope it brings joy for years to come!
        </p>
        <a href="${REVIEW_LINK}" target="_blank" class="review-button">
          ⭐ Leave a Review
        </a>
      </div>
    `;
  }
  
  return '';
}

function determinePartnershipNextAction(row) {
  const status = row[10] || '';
  const partnerId = row[0] || '';
  const contactEmail = row[4] || '';
  const contactName = row[2] || '';
  const businessName = row[5] || '';
  
  if (status === 'Pending Setup' || status === 'Pending Review') {
    const agreementFormLink = `${SMARTFORM_URL}?orderNumber=${encodeURIComponent(partnerId)}&email=${encodeURIComponent(contactEmail)}&name=${encodeURIComponent(contactName)}&projectType=partnership`;
    
    return `
      <div class="detail-card" style="background: linear-gradient(135deg, rgba(233, 255, 96, 0.1), rgba(10, 149, 168, 0.1)); border: 2px solid #e9ff60;">
        <h3 style="color: #e9ff60; margin-bottom: 1rem;">📝 Next Step: Review & Complete Your Agreement</h3>
        <p style="color: #b8bac0; margin-bottom: 1.5rem;">
          Welcome to the Legacy Lounge™ Partner Network! Review the partnership terms and complete your setup details.
        </p>
        <a href="${agreementFormLink}" target="_blank" class="btn-primary" style="display: inline-block; text-decoration: none; padding: 1rem 2rem; background: linear-gradient(135deg, #e9ff60, #0ff0b8); color: #000; border-radius: 12px; font-weight: 700; text-align: center;">
          🤝 Complete Partnership Agreement
        </a>
      </div>
    `;
  }
  
  if (status === 'Setup Scheduled') {
    return `
      <div class="detail-card" style="background: rgba(15, 240, 184, 0.05); border: 2px solid #0ff0b8;">
        <h3 style="color: #0ff0b8; margin-bottom: 1rem;">📅 Installation Scheduled</h3>
        <p style="color: #b8bac0;">
          Your Legacy Lounge™ display installation has been scheduled. Check your email for details!
        </p>
      </div>
    `;
  }
  
  if (status === 'Active') {
    return `
      <div class="detail-card" style="background: rgba(52, 97, 250, 0.05); border: 2px solid #3461fa;">
        <h3 style="color: #3461fa; margin-bottom: 1rem;">✨ Partnership Active!</h3>
        <p style="color: #b8bac0;">
          Your Legacy Lounge™ is live and generating commissions. Check below for your earnings!
        </p>
      </div>
    `;
  }
  
  return '';
}

/**
 * Create timeline - UPDATED FOR NEW COLUMN STRUCTURE
 */
function createTimeline(status, submittedDate, proofSentDate, productionStartDate, shippedDate, deliveredDate) {
  const stages = [
    { name: 'Order Confirmed', icon: '✓', complete: true, date: submittedDate },
    { name: 'Payment Received', icon: '✓', complete: true, date: submittedDate },
    { name: 'Design Submitted', icon: '✓', complete: status !== 'Payment Received', date: submittedDate },
    { name: 'In Production', icon: '🔨', complete: productionStartDate != null, current: status === 'In Production', date: productionStartDate },
    { name: 'Shipped', icon: '📦', complete: status === 'Shipped' || status === 'Delivered', current: status === 'Shipped', date: shippedDate },
    { name: 'Delivered', icon: '✓', complete: status === 'Delivered', date: deliveredDate }
  ];
  
  // Check if review button should show
  const showReview = status === 'Delivered' && deliveredDate && daysSince(deliveredDate) >= DAYS_UNTIL_REVIEW;
  
  if (showReview) {
    stages.push({
      name: 'Leave a Review',
      icon: '⭐',
      complete: false,
      current: false,
      review: true
    });
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

/**
 * Create photo gallery
 */
function createPhotoGallery(photoUrl) {
  console.log('Photo URL:', photoUrl);
  
  let imageUrl = photoUrl;
  
  // Handle Google Drive URLs
  if (photoUrl.includes('drive.google.com')) {
    let driveId = null;
    
    const match1 = photoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) driveId = match1[1];
    
    const match2 = photoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) driveId = match2[1];
    
    const match3 = photoUrl.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
    if (match3) driveId = match3[1];
    
    if (driveId) {
      imageUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w400`;
      console.log('Converted to:', imageUrl);
    }
  }
  
  return `
    <div class="detail-card photo-gallery">
      <h3>📸 Your Photo</h3>
      <div class="photo-container">
        <div class="photo-item">
          <img src="${imageUrl}" 
               alt="Uploaded photo" 
               crossorigin="anonymous"
               onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23121319%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23b8bac0%22 font-family=%22sans-serif%22 font-size=%2214%22%3EPhoto unavailable%3C/text%3E%3C/svg%3E';">
        </div>
      </div>
      <p style="margin-top:1rem;font-size:0.9rem;color:#b8bac0;text-align:center;">
        Photo not loading? <a href="${photoUrl}" target="_blank" style="color:#0a95a8;">View in Drive</a>
      </p>
    </div>
  `;
}

/**
 * Download invoice - UPDATED FOR NEW COLUMNS
 */
function downloadInvoice(index) {
  const order = allOrders[index];
  
  const orderId = order[0];
  const customerEmail = order[2];
  const honoree = order[11];
  const product = order[14];
  const template = order[15];
  const orderTotal = order[37];
  const submittedDate = order[7] ? formatDate(new Date(order[7])) : 'N/A';
  
  const invoiceWindow = window.open('', '_blank');
  invoiceWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - Order ${orderId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 40px auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #0a95a8;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #0a95a8;
        }
        .header p {
          margin: 5px 0;
          font-style: italic;
        }
        .invoice-details {
          margin: 20px 0;
        }
        .invoice-details table {
          width: 100%;
          border-collapse: collapse;
        }
        .invoice-details td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .invoice-details td:first-child {
          font-weight: bold;
          width: 200px;
        }
        .total {
          text-align: right;
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 30px;
          color: #0a95a8;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
          color: #666;
        }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🖤 DOPELEE PREZZED BY S™</h1>
        <p>Luxury keepsakes. Timelessly crafted.</p>
      </div>
      
      <h2>INVOICE</h2>
      
      <div class="invoice-details">
        <table>
          <tr>
            <td>Order Number:</td>
            <td>${orderId}</td>
          </tr>
          <tr>
            <td>Date:</td>
            <td>${submittedDate}</td>
          </tr>
          <tr>
            <td>Customer Email:</td>
            <td>${customerEmail}</td>
          </tr>
          <tr>
            <td>Honoring:</td>
            <td>${honoree}</td>
          </tr>
          <tr>
            <td>Product:</td>
            <td>${product}</td>
          </tr>
          <tr>
            <td>Template:</td>
            <td>${template}</td>
          </tr>
          <tr>
            <td>Payment Status:</td>
            <td style="color: green; font-weight: bold;">Paid ✓</td>
          </tr>
        </table>
      </div>
      
      <div class="total">
        Total: $${parseFloat(orderTotal).toFixed(2)}
      </div>
      
      <div class="footer">
        <p>Thank you for trusting us with something so meaningful.</p>
        <p>Contact: dopeleeprezzed@gmail.com</p>
      </div>
      
      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #0a95a8; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
          🖨️ Print Invoice
        </button>
      </div>
    </body>
    </html>
  `);
  invoiceWindow.document.close();
}

/**
 * UTILITY FUNCTIONS
 */

function getStatusClass(status) {
  const statusMap = {
    'Payment Received': 'status-confirmed',
    'Form Received': 'status-confirmed',
    'Awaiting Quote': 'status-confirmed',
    'Quote Sent': 'status-production',
    'Awaiting Approval': 'status-production',
    'Photos Received': 'status-confirmed',
    'Design Sent': 'status-production',
    'In Production': 'status-production',
    'Shipped': 'status-shipped',
    'Delivered': 'status-delivered',
    'Pending Setup': 'status-confirmed',
    'Pending Review': 'status-confirmed',
    'Setup Scheduled': 'status-production',
    'Active': 'status-delivered'
  };
  return statusMap[status] || 'status-confirmed';
}

function formatDate(date) {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function daysSince(date) {
  const now = new Date();
  const diff = now - new Date(date);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function showSection(sectionId) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('lookupSection').style.display = 'none';
  document.getElementById('orderList').style.display = 'none';
  document.getElementById('orderDetails').style.display = 'none';
  document.getElementById('error').style.display = 'none';
  
  document.getElementById(sectionId).style.display = 'block';
}

function showLoading() {
  showSection('loading');
}

function showLookup() {
  showSection('lookupSection');
}

function showOrderList() {
  displayOrderList();
}

function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  showSection('error');
}

function contactUs(orderId) {
  const subject = `Order ${orderId} - Question`;
  const body = `Hello,\n\nI have a question about my order #${orderId}.\n\n`;
  const mailtoLink = `mailto:dopeleeprezzed@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
}
