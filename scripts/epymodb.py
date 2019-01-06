#!/usr/bin/env python
# test script to write to coils on enervent ventilation unit

from pymodbus.client.sync import ModbusSerialClient as ModbusClient
import logging
logging.basicConfig()
log = logging.getLogger()
log.setLevel(logging.DEBUG)

client = ModbusClient(method='rtu', port='/dev/ttyUSB0', timeout=1)
client.connect()

log.debug("Reading Coils")
# starting register, number of registers, slave unit id
rr = client.read_coils(12, 1, unit=0x01)

#hh = client.read_holding_registers(1,45,unit=0x01)

#print "holding registers:"
#print hh.registers

#print "coild register:"
#print rr.bits
#print("{}: {}".format("summernight cooling status:", rr.bits[0]))

#rq = client.write_register(53, 70, unit=0x01)
#rqq = client.write_register(53, 71, unit=0x01)

#print rqq
kk =  client.read_holding_registers(53,1,unit=0x01)
print "tuuletus:"
print kk.registers


client.close()
