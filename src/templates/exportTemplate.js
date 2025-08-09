const exportTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <style>
        /* CSS Reset and Typography */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        /* Print Media Queries */
        @media print {
            body { 
                background: white !important;
                -webkit-print-color-adjust: exact;
            }
            .page-break { 
                page-break-before: always; 
            }
            .no-print { 
                display: none !important; 
            }
        }
        
        /* Header and Footer Styling */
        .metadata-header {
            padding: 20px;
            border-bottom: 2px solid #0096FF;
            margin-bottom: 30px;
        }
        
        .metadata-header h1 {
            color: #0096FF;
            margin-bottom: 10px;
        }
        
        .metadata-footer {
            padding: 20px;
            border-top: 1px solid #ccc;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
        }
        
        /* Tree Section Styling */
        .tree-section {
            margin: 40px 0;
            position: relative;
        }
        
        .tree-section h2 {
            color: #0096FF;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        
        .tree-container {
            position: relative;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            background: #fafafa;
            overflow: auto;
        }
        
        /* SVG Styling */
        .tree-svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }
        
        .tree-edge {
            stroke: #888;
            stroke-width: 2;
            fill: none;
        }
        
        /* Node Styling */
        .conversation-node {
            position: absolute;
            transition: all 0.3s ease;
        }
        
        .conversation-node:hover {
            transform: scale(1.05);
            z-index: 2000 !important;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
            border: 2px solid #0096FF !important;
        }
        
        /* Markdown content styling */
        .conversation-node h1, .conversation-node h2, .conversation-node h3 {
            font-size: 11px;
            margin: 4px 0;
        }
        
        .conversation-node p {
            margin: 2px 0;
        }
        
        .conversation-node ul, .conversation-node ol {
            margin: 2px 0;
            padding-left: 15px;
        }
        
        .conversation-node li {
            margin: 1px 0;
        }
        
        .conversation-node code {
            background: #f5f5f5;
            padding: 1px 3px;
            border-radius: 2px;
            font-size: 10px;
        }
        
        .conversation-node pre {
            background: #f5f5f5;
            padding: 4px;
            border-radius: 3px;
            overflow-x: auto;
            font-size: 10px;
            margin: 2px 0;
        }
        
        .conversation-node blockquote {
            border-left: 2px solid #ddd;
            margin: 2px 0;
            padding-left: 8px;
            font-style: italic;
        }
        
        /* Navigation Button Styling */
        .nav-button {
            transition: all 0.2s ease;
        }
        
        .nav-button:hover {
            background: #0096FF !important;
            color: white !important;
            border-color: #0096FF !important;
        }
        
        /* Overview section removed - Interactive Tree View provides complete overview */
        
        /* Page Layout */
        .page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        @media screen and (max-width: 768px) {
            .page {
                padding: 10px;
            }
            
            .conversation-node {
                position: relative !important;
                left: auto !important;
                top: auto !important;
                margin: 10px 0;
                width: 100% !important;
            }
            
            .tree-svg {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Metadata Header -->
        {{METADATA_HEADER}}
        
        <!-- Truncated Tree Section -->
        <div class="tree-section page-break">
            <h2>Interactive Tree View</h2>
            <div class="tree-container" id="truncated-tree-container" style="{{TRUNCATED_CONTAINER_STYLE}}">
                {{TRUNCATED_TREE_SVG}}
                {{TRUNCATED_TREE_NODES}}
            </div>
        </div>
        
        <!-- Full Tree Section -->
        <div class="tree-section page-break">
            <h2>Complete Conversation Details</h2>
            <div class="tree-container" id="full-tree-container" style="{{FULL_CONTAINER_STYLE}}">
                {{FULL_TREE_SVG}}
                {{FULL_TREE_NODES}}
            </div>
        </div>
        
        <!-- Metadata Footer -->
        {{METADATA_FOOTER}}
    </div>
    
    <!-- Navigation JavaScript -->
    {{NAVIGATION_JS}}
</body>
</html>`;

export default exportTemplate;
