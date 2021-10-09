import { FC, useEffect, useState } from 'react'
import { Button, message, Space, Table, Upload } from 'antd'
import { DeleteOutlined, DownloadOutlined, ExportOutlined, UploadOutlined } from '@ant-design/icons'
import { ColumnsType } from 'antd/es/table/interface'
import { UploadRequestOption } from 'rc-upload/es/interface'
import xlsx from 'xlsx'
import moment from 'moment'
import { calcHalfDays, getAnnualLeaveList, UserProps } from 'src/utils/annual'

interface UserVacationProps extends UserProps {
  total: number
  [k: number]: number
}

const Home: FC = () => {
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<UserVacationProps[]>([])
  const [tableHeight, setTableHeight] = useState(0)
  const [columns, setColumns] = useState<ColumnsType<UserVacationProps>>([])

  useEffect(() => {
    let items: ColumnsType<UserVacationProps> = [
      {
        width: 80,
        title: '序号',
        render: (value, record, index) => index + 1,
      },
      {
        width: 150,
        title: '工号',
        dataIndex: 'id',
        sorter: (a, b) => {
          if (a.id > b.id) {
            return 1
          }
          return -1
        },
      },
      {
        width: 150,
        title: '姓名',
        dataIndex: 'name',
        sorter: (a, b) => {
          if (a.name > b.name) {
            return 1
          }
          return -1
        },
      },
      {
        width: 150,
        title: '入职日期',
        dataIndex: 'entrydate',
        sorter: (a, b) => {
          if (a.entrydate > b.entrydate) {
            return 1
          }
          return -1
        },
      },
      {
        width: 150,
        title: '工龄核算时间',
        dataIndex: 'workdate',
        sorter: (a, b) => {
          if (a.workdate > b.workdate) {
            return 1
          }
          return -1
        },
      },
    ]
    let end = new Date().getFullYear()
    for (let start = 2018; start <= end; start++) {
      items.push({
        title: `${start}年年假`,
        dataIndex: `${start}`,
        render: (value, record) => {
          return record.workdate ? value : ''
        },
        sorter: (a, b) => a[start] - b[start],
      })
    }
    items.push({
      width: 120,
      title: '总年假',
      dataIndex: 'total',
      render: (value, record) => {
        return record.workdate ? value : ''
      },
      sorter: (a, b) => a.total - b.total,
    })
    setColumns(items)
  }, [])

  // 更新table高度
  function updateTableHeight() {
    let height = document.body.clientHeight - 48 - 32 - 55
    setTableHeight(height)
  }

  useEffect(() => {
    updateTableHeight()
    window.addEventListener('resize', updateTableHeight)
    return () => {
      window.removeEventListener('resize', updateTableHeight)
    }
  }, [])

  //  timeValue是指excel中的时间整数值
  function formatDate(timeValue: number) {
    return xlsx.SSF.format('yyyy/mm/dd', timeValue)
  }

  // 上传Excel
  function uploadExcel(options: UploadRequestOption) {
    setLoading(true)
    let reader = new FileReader()
    reader.onload = (e) => {
      try {
        var workbook = xlsx.read(e.target?.result, { type: 'binary' })

        let json = xlsx.utils.sheet_to_json(workbook.Sheets.Sheet1)

        const users: UserProps[] = []
        json.forEach((el: any) => {
          users.push({
            id: el['工号'],
            name: el['姓名'],
            entrydate: typeof el['入职日期'] === 'number' ? formatDate(el['入职日期']) : el['入职日期'],
            workdate: typeof el['工龄核算时间'] === 'number' ? formatDate(el['工龄核算时间']) : el['入职日期'],
          })
        })

        let data = getAnnualLeaveList(users)
        let rows = data.map((el) => {
          let row: UserVacationProps = {
            id: el.id,
            name: el.name,
            entrydate: el.entrydate,
            workdate: el.workdate,
            total: 0,
          }
          let sum = 0
          el.annuals.forEach((item) => {
            sum += item.days
            row[item.year] = item.days
          })
          row.total = calcHalfDays(sum)
          return row
        })

        setLoading(false)
        setList(rows)
      } catch {
        setLoading(false)
        message.error('文件格式不正确，请下载Excel模版')
      }
    }
    if (options.file instanceof Blob) {
      reader.readAsBinaryString(options.file)
    }
  }

  // 导出计算结果
  function exportExcel() {
    let filename = `${moment().format('YYYYMMDD')}年假.xlsx`
    let ws_name = 'Sheet1'
    if (list.length === 0) {
      message.warning('没有数据导出')
      return
    }
    const sheet = list.map((el) => {
      let item = {
        工号: el.id,
        姓名: el.name,
        入职日期: moment(el.entrydate).format('YYYY/M/D'),
        工龄核算时间: el.workdate ? moment(el.workdate).format('YYYY/M/D') : '',
        总年假: el.workdate ? el.total : '',
      }
      let year: any = {}
      let end = new Date().getFullYear()
      for (let start = 2018; start <= end; start++) {
        year[`${start}年年假`] = el.workdate ? el[start] : ''
      }

      return { ...item, ...year }
    })
    let wb = xlsx.utils.book_new()
    let header = []
    for (let i = 2018; i <= moment().year(); i++) {
      header.push(`${i}年年假`)
    }
    let ws = xlsx.utils.json_to_sheet(sheet, {
      header: ['工号', '姓名', '入职日期', '工龄核算时间', ...header, '总年假'],
    })
    xlsx.utils.book_append_sheet(wb, ws, ws_name)
    xlsx.writeFile(wb, filename)
  }

  // 下载模版
  function downloadTemplate() {
    let wb = xlsx.utils.book_new()
    let ws = xlsx.utils.json_to_sheet([], {
      header: ['工号', '姓名', '入职日期', '工龄核算时间'],
    })
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1')
    xlsx.writeFile(wb, '年假.xlsx')
  }

  // 清空数据
  function clearData() {
    setList([])
  }

  return (
    <>
      <div style={{ padding: 24 }}>
        <Button ghost type="primary" icon={<DownloadOutlined />} onClick={downloadTemplate} style={{ float: 'right' }}>
          下载Excel模版
        </Button>
        <Space>
          <Upload accept=".xls,.xlsx" showUploadList={false} customRequest={uploadExcel}>
            <Button ghost type="primary" icon={<UploadOutlined />} loading={loading}>
              上传员工信息
            </Button>
          </Upload>
          <Button type="primary" icon={<ExportOutlined />} onClick={exportExcel}>
            导出计算结果
          </Button>
          <Button type="default" icon={<DeleteOutlined />} onClick={clearData}>
            清空数据
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        showSorterTooltip={false}
        loading={loading}
        columns={columns}
        dataSource={list}
        pagination={false}
        scroll={{ y: tableHeight }}
      />
    </>
  )
}

export default Home
