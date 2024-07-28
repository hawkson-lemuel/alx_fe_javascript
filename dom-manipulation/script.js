// Initial quotes array (will be loaded from local storage if available)
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
  { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", category: "Inspiration" },
  { text: "The purpose of our lives is to be happy.", category: "Life" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Get busy living or get busy dying.", category: "Motivation" }
];

// Save quotes to local storage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Function to populate category dropdown
function populateCategories() {
  const categoryFilter = document.getElementById('categoryFilter');
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  const categories = [...new Set(quotes.map(quote => quote.category))];
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
  const lastSelectedCategory = localStorage.getItem('selectedCategory');
  if (lastSelectedCategory) {
    categoryFilter.value = lastSelectedCategory;
  }
}

// Function to display quotes based on selected category
function filterQuotes() {
  const selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('selectedCategory', selectedCategory);
  const filteredQuotes = selectedCategory === 'all' ? quotes : quotes.filter(quote => quote.category === selectedCategory);
  displayQuotes(filteredQuotes);
}

// Function to display quotes
function displayQuotes(quotesToDisplay) {
  const quoteDisplay = document.getElementById('quoteDisplay');
  quoteDisplay.innerHTML = '';
  quotesToDisplay.forEach(quote => {
    const quoteText = document.createElement('p');
    quoteText.textContent = quote.text;
    
    const quoteCategory = document.createElement('p');
    quoteCategory.textContent = `- ${quote.category}`;
    quoteCategory.style.fontStyle = 'italic';
    
    quoteDisplay.appendChild(quoteText);
    quoteDisplay.appendChild(quoteCategory);
  });
}

// Function to display a random quote
function showRandomQuote() {
  const filteredQuotes = document.getElementById('categoryFilter').value === 'all' ? quotes : quotes.filter(quote => quote.category === document.getElementById('categoryFilter').value);
  const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
  displayQuotes([randomQuote]);
  
  // Save the last viewed quote to session storage
  sessionStorage.setItem('lastViewedQuote', JSON.stringify(randomQuote));
}

// Function to add a new quote
async function createAddQuoteForm() {
  const newQuoteText = document.getElementById('newQuoteText').value;
  const newQuoteCategory = document.getElementById('newQuoteCategory').value;

  if (newQuoteText && newQuoteCategory) {
    const newQuote = { text: newQuoteText, category: newQuoteCategory };
    quotes.push(newQuote);
    saveQuotes();
    await postQuoteToServer(newQuote);
    populateCategories();
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
    alert('New quote added successfully!');
  } else {
    alert('Please enter both quote text and category.');
  }
}

// Function to export quotes to a JSON file
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Function to import quotes from a JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    const importedQuotes = JSON.parse(event.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert('Quotes imported successfully!');
  };
  fileReader.readAsText(event.target.files[0]);
}

// Fetch quotes from server
async function fetchQuotesFromServer() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    const serverQuotes = await response.json();
    return serverQuotes.map(quote => ({ text: quote.title, category: 'Server' }));
  } catch (error) {
    console.error('Error fetching quotes from server:', error);
    return [];
  }
}

// Post quote to server
async function postQuoteToServer(quote) {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quote)
    });
    return await response.json();
  } catch (error) {
    console.error('Error posting quote to server:', error);
  }
}

// Function to sync quotes with the server
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  const localQuotes = JSON.parse(localStorage.getItem('quotes')) || [];

  // Check for conflicts and merge quotes
  const mergedQuotes = mergeQuotes(localQuotes, serverQuotes);
  localStorage.setItem('quotes', JSON.stringify(mergedQuotes));

  // Notify user if new quotes are added
  if (serverQuotes.length > localQuotes.length) {
    showNotification('New quotes have been added from the server.');
  }

  showNotification("Quotes synced with server!");
}

// Start periodic fetching
function startPeriodicFetching(interval = 60000) { // Fetch every minute
  setInterval(syncQuotes, interval);
}

// Merge quotes with conflict resolution
function mergeQuotes(localQuotes, serverQuotes) {
  const localQuotesText = localQuotes.map(quote => quote.text);
  const newQuotes = serverQuotes.filter(quote => !localQuotesText.includes(quote.text));
  return [...localQuotes, ...newQuotes];
}

// Show notification
function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.style.display = 'block';
  setTimeout(() => {
    notification.style.display = 'none';
  }, 5000);
}

// Load the last viewed quote from session storage
window.onload = async function() {
  populateCategories();
  filterQuotes();
  const lastViewedQuote = JSON.parse(sessionStorage.getItem('lastViewedQuote'));
  if (lastViewedQuote) {
    displayQuotes([lastViewedQuote]);
  }
  startPeriodicFetching();
}

// Event listeners for buttons
document.getElementById('newQuote').addEventListener('click', showRandomQuote);
document.getElementById('addQuoteButton').addEventListener('click', createAddQuoteForm);
document.getElementById('exportQuotes').addEventListener('click', exportToJsonFile);
document.getElementById('importFile').addEventListener('change', importFromJsonFile);
