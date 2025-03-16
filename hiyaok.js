// Import required packages
const { Telegraf } = require('telegraf');
const axios = require('axios');

// Bot configuration
const TOKEN = process.env.TOKEN; // Ambil dari variabel lingkungan
const SHEET_ID = process.env.SHEET_ID;
const SHEET_NAME = 'Sheet1'; // bisa ganti dengan bagian sheets

// Initialize the bot
const bot = new Telegraf(TOKEN);

// Fungsi untuk mendapatkan data dari Google Sheets
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

// Fungsi untuk mendapatkan kategori unik dari sheet
async function getUniqueCategories() {
  const data = await getSheetData();
  const categories = new Set();
  
  // Mulai dari baris 1 (index 1) untuk melewati header
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].trim() !== '') {
      categories.add(data[i][1]);
    }
  }
  
  return Array.from(categories).sort();
}

// Fungsi untuk menghasilkan pesan bantuan
async function generateHelpMessage() {
  const categories = await getUniqueCategories();
  let helpMessage = "*List perintah yang bisa digunakan:*\n\n";
  helpMessage += "/start - *Perintah untuk memulai bot.*\n";
  helpMessage += "/help - *Menampilkan daftar perintah.*\n";
  helpMessage += "/ping - *Mengetes koneksi bot.*\n";
  
  // Tambahkan perintah marketplace
  helpMessage += "/lazada - *Perintah untuk link marketplace Lazada.*\n";
  helpMessage += "/shopee - *Perintah untuk link marketplace Shopee.*\n";
  helpMessage += "/tokopedia - *Perintah untuk link marketplace Tokopedia.*\n";
  helpMessage += "/zalora - *Perintah untuk link marketplace Zalora.*\n";
  
  return helpMessage;
}

// Fungsi untuk menghasilkan respons berdasarkan kategori
async function generateCategoryResponse(ctx, category) {
  const data = await getSheetData();
  let response = `========== *Kategori Produk* ==========:\n`;
  let count = 1;
  let foundCategory = false;
  
  for (let i = 1; i < data.length; i++) {
    if (
      (data[i][1] && data[i][1].toLowerCase() === category.toLowerCase()) ||
      (data[i][3] && data[i][3].toLowerCase() === category.toLowerCase()) ||
      (data[i][5] && data[i][5].toLowerCase() === category.toLowerCase()) ||
      (data[i][7] && data[i][7].toLowerCase() === category.toLowerCase())
    ) {
      foundCategory = true;
      response += `${count}. *${category.toUpperCase()}*\n`;
      
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
    return "Kategori tidak ditemukan! ❌";
  }
  
  return response;
}

// Fungsi untuk menghasilkan respons berdasarkan marketplace
async function generateMarketplaceResponse(ctx, marketplace) {
  const data = await getSheetData();
  let response = `========== *Kategori Produk* ==========:\n`;
  let count = 1;
  
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
    return "Marketplace tidak ditemukan! ❌";
  }
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIndex] && data[i][colIndex + 1]) {
      response += `${count}. *${data[i][colIndex + 1]}*\n`;
      response += `Link 👉 ${data[i][colIndex]}\n\n`;
      count++;
    }
  }
  
  if (count === 1) {
    return "Tidak ada produk untuk marketplace ini! ❌";
  }
  
  return response;
}

// Bot commands
bot.start((ctx) => {
  ctx.reply("Halo, perkenalkan saya ini bot! 🤖\nDibuat dengan Node.js dan Telegraf\n\nPilih perintah /help untuk melihat command lainnya.");
});

bot.help(async (ctx) => {
  const helpMessage = await generateHelpMessage();
  ctx.reply(helpMessage);
});

bot.command('ping', (ctx) => {
  ctx.reply('Pong! 🏓');
});

// Fungsi untuk mengirim pesan ping secara berkala
const chatId = '7776878622'; // Ganti dengan ID chat Anda
const pingInterval = 10 * 60 * 1000; // 10 menit

setInterval(() => {
  bot.telegram.sendMessage(chatId, "Bot masih aktif! 🟢");
}, pingInterval);

// Perintah marketplace
bot.command('shopee', async (ctx) => {
  ctx.reply("🔄 *Mencari data...*"); // Pesan loading
  const response = await generateMarketplaceResponse(ctx, 'SHOPEE');
  ctx.editMessageText(response, { parse_mode: 'Markdown' });
});

bot.command('lazada', async (ctx) => {
  ctx.reply("🔄 *Mencari data...*"); // Pesan loading
  const response = await generateMarketplaceResponse(ctx, 'LAZADA');
  ctx.editMessageText(response, { parse_mode: 'Markdown' });
});

bot.command('tokopedia', async (ctx) => {
  ctx.reply("🔄 *Mencari data...*"); // Pesan loading
  const response = await generateMarketplaceResponse(ctx, 'TOKOPEDIA');
  ctx.editMessageText(response, { parse_mode: 'Markdown' });
});

bot.command('zalora', async (ctx) => {
  ctx.reply("🔄 *Mencari data...*"); // Pesan loading
  const response = await generateMarketplaceResponse(ctx, 'ZALORA');
  ctx.editMessageText(response, { parse_mode: 'Markdown' });
});

// Handle other commands (categories)
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  
  if (text.startsWith('/')) {
    const searchTerm = text.replace('/', '').toUpperCase();
    
    const categories = await getUniqueCategories();
    const matchedCategory = categories.find(cat => 
      cat.toUpperCase() === searchTerm
    );
    
    if (matchedCategory) {
      ctx.reply("🔄 *Mencari data...*"); // Pesan loading
      const response = await generateCategoryResponse(ctx, matchedCategory);
      ctx.editMessageText(response, { parse_mode: 'Markdown' });
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
