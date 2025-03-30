import fs from 'fs';      // File system module for file operations
import path from 'path';  // Path module for handling file paths

/**
 * Configuration object for the file organizer
 * This allows users to customize the behavior without changing the code
 */
const config = {
  // The directory to scan and organize files in
  sourceDir: './downloads',
  
  // Whether to create category directories if they don't exist
  // If false, files that would go into non-existent directories will be skipped
  createDirs: true,
  
  // Whether to actually move files or just simulate (dry run)
  // Setting to false is useful for testing before making changes
  moveFiles: true,
  
  // File categories and their associated file extensions
  // Each category will become a subdirectory, and files will be moved based on their extension
  categories: {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'],
    audio: ['.mp3', '.wav', '.ogg', '.flac', '.aac'],
    video: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv'],
    archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    code: ['.js', '.py', '.java', '.html', '.css', '.php', '.c', '.cpp', '.rb', '.go', '.ts']
    // IMPORTANT NOTE: Any files with extensions not listed here will go to an 'other' category
  }
};

/**
 * Create category directories if they don't exist
 * This ensures we have somewhere to move the files to
 */
if (config.createDirs) {
  // Loop through each category defined in the config
  for (const category of Object.keys(config.categories)) {
    // Create the full path for this category
    const categoryPath = path.join(config.sourceDir, category);
    
    // Check if the directory already exists
    if (!fs.existsSync(categoryPath)) {
      // Create the directory (and any parent directories if needed)
      fs.mkdirSync(categoryPath, { recursive: true });
      console.log(`Created directory: ${categoryPath}`);
    }
  }
}

// Try-catch block to handle any errors that might occur during processing
try {
  /**
   * Read all files from the source directory
   * This gives us an array of filenames we need to process
   */
  const files = fs.readdirSync(config.sourceDir);
  
  /**
   * Statistics object to track what happens during processing
   * This helps provide a summary at the end
   */
  const stats = {
    total: 0,      // Total files found
    moved: 0,      // Files successfully moved
    skipped: 0,    // Files skipped (already in correct directory)
    byCategory: {} // Count of files per category
  };
  
  /**
   * Process each file in the directory
   */
  for (const file of files) {
    // Create the full path to the current file
    const filePath = path.join(config.sourceDir, file);
    
    // Skip directories - we only want to organize files
    // fs.statSync gets information about the file, including whether it's a directory
    if (fs.statSync(filePath).isDirectory()) continue;
    
    // Increment the total files counter
    stats.total++;
    
    /**
     * Determine which category this file belongs to
     */
    // Get the file extension (e.g., .jpg, .pdf) and convert to lowercase
    // This ensures case-insensitive matching (.JPG and .jpg are treated the same)
    const ext = path.extname(file).toLowerCase();
    
    // Default category is 'other' for files that don't match any defined category
    let targetCategory = 'other';
    
    // Check each category to see if this file extension is included
    for (const [category, extensions] of Object.entries(config.categories)) {
      if (extensions.includes(ext)) {
        targetCategory = category;
        break; // Stop searching once we find a match
      }
    }
    
    /**
     * Update statistics for reporting
     */
    // Initialize the category counter if this is the first file of this category
    stats.byCategory[targetCategory] = (stats.byCategory[targetCategory] || 0) + 1;
    
    /**
     * Check if the file is already in the correct directory
     * If it is, we can skip it to avoid unnecessary operations
     */
    if (path.dirname(filePath) === path.join(config.sourceDir, targetCategory)) {
      stats.skipped++;
      continue; // Skip to the next file
    }
    
    /**
     * Create the target path where the file should be moved to
     */
    const targetPath = path.join(config.sourceDir, targetCategory, file);
    
    // Log the operation we're about to perform
    console.log(`Moving ${file} to ${targetCategory}/`);
    
    /**
     * Move the file if enabled in config
     * This is wrapped in its own try-catch to handle errors for individual files
     * without stopping the entire process
     */
    if (config.moveFiles) {
      try {
        // fs.renameSync moves a file from one location to another
        fs.renameSync(filePath, targetPath);
        stats.moved++; // Increment the counter for successfully moved files
      } catch (err) {
        // Log any errors that occur during the move operation
        // This could happen due to permissions, disk space, etc.
        console.error(`Error moving ${file}: ${err.message}`);
      }
    }
  }
  
  /**
   * Print a summary of what was done
   * This gives the user a clear overview of the changes made
   */
  console.log('\nOrganization complete!');
  console.log(`Total files processed: ${stats.total}`);
  console.log(`Files moved: ${stats.moved}`);
  console.log(`Files skipped: ${stats.skipped}`);
  console.log('\nFiles by category:');
  
  // Show how many files ended up in each category
  for (const [category, count] of Object.entries(stats.byCategory)) {
    console.log(`- ${category}: ${count} files`);
  }
  
} catch (err) {
  // Handle any errors that might occur during directory reading
  // This could happen if the source directory doesn't exist or isn't accessible
  console.error(`Error reading directory: ${err.message}`);
}