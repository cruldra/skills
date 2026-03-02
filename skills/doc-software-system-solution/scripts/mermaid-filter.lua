-- mermaid-filter.lua
-- Converts mermaid code blocks to images using mermaid-cli

local system = require 'pandoc.system'

local function mermaid(block)
  if block.classes[1] == "mermaid" then
    local content = block.text
    local filename = os.tmpname() .. ".png"
    local caption = block.attributes["caption"] or ""
    
    -- Write mermaid content to temp file
    local cmd = "mmdc -i - -o " .. filename
    local job = io.popen(cmd, "w")
    job:write(content)
    job:close()
    
    -- Read image content (optional, or just link)
    -- For docx, we usually need the file to exist at conversion time
    
    local img = pandoc.Image({pandoc.Str(caption)}, filename, "")
    return pandoc.Para({img})
  end
  return nil
end

return {
  {CodeBlock = mermaid}
}
