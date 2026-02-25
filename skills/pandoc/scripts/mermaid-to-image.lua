local system = require 'pandoc.system'

-- 检查文件是否存在
local function file_exists(name)
    local f = io.open(name, "r")
    if f then
        f:close()
        return true
    else
        return false
    end
end

function CodeBlock(el)
    -- 只处理类名为 "mermaid" 的代码块
    if el.classes[1] == "mermaid" then
        -- 根据代码内容生成唯一的哈希值，作为文件名（避免重复渲染相同图表）
        local name = "mermaid-" .. pandoc.sha1(el.text) .. ".png"
        
        -- 如果图片不存在，则调用 mmdc 生成
        if not file_exists(name) then
            print("Converting Mermaid block to " .. name .. "...")
            -- 将 Mermaid 源码写入临时文件
            local tmp_src = name .. ".mmd"
            local f = io.open(tmp_src, "w")
            f:write(el.text)
            f:close()

            -- 调用 mmdc (确保 mmdc 在你的环境变量 PATH 中)
            -- 对于 Word，PNG 格式兼容性最好
            os.execute(string.format("mmdc -i %s -o %s -b transparent", tmp_src, name))
            
            -- 删除临时源码文件
            os.remove(tmp_src)
        end

        -- 返回一个包含该图像的段落，替换掉原来的代码块
        return pandoc.Para({pandoc.Image({}, name)})
    end
end