// Window manager service for aspect ratio preservation
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalSize } from '@tauri-apps/api/dpi';

const ASPECT_RATIO = 16 / 9; // 1.777...
const MIN_WIDTH = 1280;
const MIN_HEIGHT = 720;

export class WindowManager {
  private window = getCurrentWindow();
  private isResizing = false;
  
  async initialize() {
    // Set up resize listener
    await this.window.onResized(async (event) => {
      if (this.isResizing) return;
      
      const { width, height } = event.payload;
      await this.enforceAspectRatio(width, height);
    });
    
    // Set initial constraints
    await this.setInitialConstraints();
  }
  
  private async setInitialConstraints() {
    try {
      // Set minimum size
      await this.window.setMinSize(new LogicalSize(MIN_WIDTH, MIN_HEIGHT));
      
      // Ensure current size meets minimum requirements
      const currentSize = await this.window.innerSize();
      if (currentSize.width < MIN_WIDTH || currentSize.height < MIN_HEIGHT) {
        await this.window.setSize(new LogicalSize(MIN_WIDTH, MIN_HEIGHT));
      }
    } catch (error) {
      console.warn('Failed to set window constraints:', error);
    }
  }
  
  private async enforceAspectRatio(width: number, height: number) {
    if (this.isResizing) return;
    
    this.isResizing = true;
    
    try {
      // Calculate what the dimensions should be based on aspect ratio
      const targetWidthFromHeight = Math.round(height * ASPECT_RATIO);
      const targetHeightFromWidth = Math.round(width / ASPECT_RATIO);
      
      let newWidth = width;
      let newHeight = height;
      
      // Determine which dimension to adjust based on which gives larger size
      if (targetWidthFromHeight >= MIN_WIDTH && targetHeightFromWidth >= MIN_HEIGHT) {
        // Both are valid, choose the one that's closer to current
        const widthDiff = Math.abs(width - targetWidthFromHeight);
        const heightDiff = Math.abs(height - targetHeightFromWidth);
        
        if (widthDiff < heightDiff) {
          newWidth = targetWidthFromHeight;
        } else {
          newHeight = targetHeightFromWidth;
        }
      } else if (targetWidthFromHeight >= MIN_WIDTH) {
        // Adjust based on height
        newWidth = targetWidthFromHeight;
      } else if (targetHeightFromWidth >= MIN_HEIGHT) {
        // Adjust based on width
        newHeight = targetHeightFromWidth;
      } else {
        // Both would be too small, use minimum size
        newWidth = MIN_WIDTH;
        newHeight = MIN_HEIGHT;
      }
      
      // Only resize if dimensions changed significantly
      if (Math.abs(width - newWidth) > 2 || Math.abs(height - newHeight) > 2) {
        await this.window.setSize(new LogicalSize(newWidth, newHeight));
      }
    } catch (error) {
      console.warn('Failed to enforce aspect ratio:', error);
    } finally {
      // Add small delay to prevent rapid resize loops
      setTimeout(() => {
        this.isResizing = false;
      }, 100);
    }
  }
}

// Singleton instance
export const windowManager = new WindowManager();