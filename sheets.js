// Import required packages
const { Telegraf } = require('telegraf');
const axios = require('axios');

// Bot configuration
const TOKEN = '8150553743:AAHk2aac32xLL9erzl1l2a1EQO7_Xqmy1TU';
const SHEET_ID = '1rk1d5MQByRpUz6WPyZRqBJp3QYeiv_vQF1NnR2M2gNQ';
const SHEET_NAME = 'Sheet1';

// Initialize the bot
const bot = new Telegraf(TOKEN);

// Function to get sheet data directly using public spreadsheet URL
async function getSheetData() {
  try {
    const response = await axios.get(
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`
    );
    
    // Parse CSV data
    const rows = response.data.split('\n').map(row => 
      row.split(',').map(cell => 
        // Remove quotes from cell values
        cell.replace(/^"(.*)"$/, '$1')
      )
    );
    
    return rows;
  } catch (error) {
    console.error('Error fetching spreadsheet data:', error);
    return [];
  }
}

// Function to get unique categories from sheet
async function getUniqueCategories() {
  const data = await getSheetData();
  const categories = new Set();
  
  // Start from row 1 (index 1) to skip header
  for (let i = 1; i < data.length; i++) {
    // Check column B (index 1) for categories (KET)
    if (data[i][1] && data[i][1].trim() !== '') {
      categories.add(data[i][1]);
    }
  }
  
  return Array.from(categories).sort();
}

// Function to generate help message
async function generateHelpMessage() {
  const categories = await getUniqueCategories();
  let helpMessage = "List perintah yang bisa digunakan:\n\n";
  helpMessage += "/start - Perintah untuk memulai bot.\n";
  
  // Add standard marketplace commands
  helpMessage += "/lazada - Perintah untuk link marketplace Lazada.\n";
  helpMessage += "/shopee - Perintah untuk link marketplace Shopee.\n";
  helpMessage += "/tokopedia - Perintah untuk link marketplace Tokopedia.\n";
  helpMessage += "/zalora - Perintah untuk link marketplace Zalora.\n";
  
  return helpMessage;
}

// Function to generate response based on category
async function generateCategoryResponse(category) {
  const data = await getSheetData();
  let response = `========== Kategori Produk ==========:\n`;
  let count = 1;
  let foundCategory = false;
  
  // Start from row 1 to skip header
  for (let i = 1; i < data.length; i++) {
    // Check category in columns B/D/F/H (case-insensitive)
    if (
      (data[i][1] && data[i][1].toLowerCase() === category.toLowerCase()) ||
      (data[i][3] && data[i][3].toLowerCase() === category.toLowerCase()) ||
      (data[i][5] && data[i][5].toLowerCase() === category.toLowerCase()) ||
      (data[i][7] && data[i][7].toLowerCase() === category.toLowerCase())
    ) {
      foundCategory = true;
      
      // Display category name and sequence number
      response += `${count}. ${category.toUpperCase()}\n`;
      
      // Add links from all available marketplaces for this category
      if (data[i][0]) { // Shopee
        response += `Link 👉 ${data[i][0]}\n`;
      }
      
      if (data[i][2]) { // Lazada
        response += `Link 👉 ${data[i][2]}\n`;
      }
      
      if (data[i][4]) { // Zalora
        response += `Link 👉 ${data[i][4]}\n`;
      }
      
      if (data[i][6]) { // Tokopedia
        response += `Link 👉 ${data[i][6]}\n`;
      }
      
      count++;
    }
  }
  
  if (!foundCategory) {
    return "Kategori tidak ditemukan!";
  }
  
  return response;
}

// Function to generate response based on marketplace
async function generateMarketplaceResponse(marketplace) {
  const data = await getSheetData();
  let response = `========== Kategori Produk ==========:\n`;
  let count = 1;
  
  // Determine which column to use
  let colIndex;
  if (marketplace.toUpperCase() === 'SHOPEE') {
    colIndex = 0; // Column A (index 0) for Shopee
  } else if (marketplace.toUpperCase() === 'LAZADA') {
    colIndex = 2; // Column C (index 2) for Lazada
  } else if (marketplace.toUpperCase() === 'ZALORA') {
    colIndex = 4; // Column E (index 4) for Zalora
  } else if (marketplace.toUpperCase() === 'TOKOPEDIA') {
    colIndex = 6; // Column G (index 6) for Tokopedia
  } else {
    return "Marketplace tidak ditemukan!";
  }
  
  // Start from row 1 to skip header
  for (let i = 1; i < data.length; i++) {
    // Make sure there's data in the link and category columns
    if (data[i][colIndex] && data[i][colIndex+1]) {
      response += `${count}. ${data[i][colIndex+1]}\n`;
      response += `Link 👉 ${data[i][colIndex]}\n\n`;
      count++;
    }
  }
  
  if (count === 1) {
    return "Tidak ada produk untuk marketplace ini!";
  }
  
  return response;
}

// Bot commands
bot.start((ctx) => {
  ctx.reply("Halo, perkenalkan saya adalah bot telegram\n\npilih perintah /help untuk melihat comand lainnya.");
});

bot.help(async (ctx) => {
  const helpMessage = await generateHelpMessage();
  ctx.reply(helpMessage);
});

bot.command('shopee', async (ctx) => {
  const response = await generateMarketplaceResponse('SHOPEE');
  ctx.reply(response);
});

bot.command('lazada', async (ctx) => {
  const response = await generateMarketplaceResponse('LAZADA');
  ctx.reply(response);
});

bot.command('tokopedia', async (ctx) => {
  const response = await generateMarketplaceResponse('TOKOPEDIA');
  ctx.reply(response);
});

bot.command('zalora', async (ctx) => {
  const response = await generateMarketplaceResponse('ZALORA');
  ctx.reply(response);
});

// Handle other commands (categories)
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  
  // Check if it's a command
  if (text.startsWith('/')) {
    // Extract the search term
    const searchTerm = text.replace('/', '').toUpperCase();
    
    // Check if searchTerm is one of the categories
    const categories = await getUniqueCategories();
    const matchedCategory = categories.find(cat => 
      cat.toUpperCase() === searchTerm
    );
    
    if (matchedCategory) {
      const response = await generateCategoryResponse(matchedCategory);
      ctx.reply(response);
    } else {
      ctx.reply("Perintah tidak dikenali. Gunakan /help untuk melihat daftar perintah.");
    }
  }
});

// Start bot with long polling
bot.launch().then(() => {
  console.log('Bot started in polling mode');
}).catch(err => {
  console.error('Error starting bot:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
