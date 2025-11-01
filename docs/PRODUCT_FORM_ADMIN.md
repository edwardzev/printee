# Product Form Admin Feature

## Overview

This feature provides a user-friendly admin interface for adding new products to the Printeam catalog. It includes a comprehensive form with all product properties, real-time JSON preview, and validation.

## Features

### 1. Comprehensive Product Form
The form includes fields for all required product properties:
- **Basic Information**: SKU, Appearance (sort order), Name (EN/HE), Description (EN/HE), Technology, Base Price
- **Colors**: Multi-select checkboxes for available colors
- **Size Ranges**: Multi-select checkboxes for available sizes
- **Images**: Dynamic image path inputs (automatically shows inputs for each selected color)
- **Active Print Areas**: Multi-select checkboxes for print locations
- **Specifications**: Material, Weight, and Care Instructions (both English and Hebrew)

### 2. Real-time JSON Preview
- Click "Show JSON Preview" to see the generated JSON structure
- The JSON updates automatically as you fill the form
- Helps verify the data structure before submission

### 3. Form Validation
- Client-side validation ensures all required fields are filled
- Clear error messages guide users to missing or invalid data
- "Validate" button allows checking form completeness without submitting

### 4. User-Friendly Interface
- Clean, organized layout with sections
- Hebrew text support with proper RTL direction
- Responsive design works on various screen sizes
- Dynamic behavior (e.g., image inputs appear for selected colors)

## How to Access

1. Navigate to `/admin` in your browser
2. Log in with the admin password (set via `VITE_ADMIN_PASS` environment variable)
3. Click on the "Products" tab
4. Fill out the "Add New Product" form

## Usage Instructions

### Filling Out the Form

1. **SKU** (Required): Enter a unique identifier (e.g., 'polo-shirt')
2. **Appearance**: Enter a number for sort order (lower numbers appear first)
3. **Names & Descriptions** (Required): Fill in both English and Hebrew
4. **Technology**: Select the printing technology (DTF, DTG, etc.)
5. **Base Price** (Required): Enter the base price in ₪
6. **Colors** (Required): Check at least one color
7. **Size Range** (Required): Check at least one size
8. **Images**: Enter comma-separated image paths for each color
9. **Print Areas**: Select the areas where printing is allowed
10. **Specifications** (Required): Fill in material information in both languages

### Previewing the JSON

Click the "Show JSON Preview" button to see the generated JSON structure. This helps verify:
- All fields are correctly formatted
- Arrays and objects are structured properly
- No missing required data

### Submitting the Form

1. Click "Validate" to check for any missing required fields
2. Once validation passes, click "Submit Product"
3. The product will be added to the products.js file

## Important Notes

### Development vs. Production

**Development Environment:**
- The API endpoint (`/api/admin/add-product`) works when running locally with `npm run dev`
- It directly modifies the `src/data/products.js` file
- Changes need to be committed to Git and deployed

**Production Environment (Vercel):**
- The filesystem is read-only in serverless environments
- The API endpoint will not work on Vercel
- Consider alternative approaches for production:
  - Use a database for product management
  - Use a headless CMS
  - Manually update products.js and redeploy

### Security Considerations

- The admin interface has a simple password gate (client-side)
- For production use, implement proper server-side authentication
- The `VITE_ADMIN_PASS` environment variable should be kept secret
- Consider adding rate limiting and CSRF protection

### Workflow Recommendation

For production use, we recommend:
1. Use this form locally during development
2. Test the JSON output thoroughly
3. Submit to add the product to products.js
4. Review the changes in Git
5. Commit and deploy through your normal CI/CD process

## File Structure

```
src/
  components/
    ProductForm.jsx           # Main form component
  pages/
    Admin.jsx                 # Admin dashboard (includes ProductForm)
api/
  admin/
    add-product.js            # API endpoint for adding products
```

## Technical Details

### Form Component
- Built with React and Tailwind CSS
- Uses React hooks for state management
- Real-time JSON generation
- Dynamic form fields based on selections

### API Endpoint
- Uses Babel parser to read and modify products.js
- Preserves code structure and formatting
- Inserts new products in correct position based on `appearance` value
- Handles all product properties including nested objects and arrays

### Validation Rules
- SKU: Required, must be unique
- Name (EN/HE): Both required
- Description (EN/HE): Both required
- Colors: At least one required
- Size Range: At least one required
- Base Price: Required, must be > 0
- Material (EN/HE): Both required

## Troubleshooting

**Form not appearing:**
- Ensure you're logged in to the admin dashboard
- Check that you're on the "Products" tab

**Submit button not working:**
- Check browser console for errors
- Ensure all required fields are filled
- Verify the API endpoint is accessible (local dev only)

**JSON preview not updating:**
- Try toggling the preview off and on
- Check browser console for errors

**Changes not persisting:**
- Remember this only works in local development
- Check that you have write permissions to the file
- Verify products.js exists and is properly formatted
